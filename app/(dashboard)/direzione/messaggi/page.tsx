'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { Message, Profile } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Loader2, Send, Mail, MailOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function DirezioneMessaggiPage() {
  const { profile } = useAuth();
  const [sent, setSent] = useState<Message[]>([]);
  const [companyUsers, setCompanyUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [form, setForm] = useState({ to_user_id: '', oggetto: '', contenuto: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    const [sentRes, dirRes] = await Promise.all([
      supabase.from('messages').select('*, to_profile:profiles!messages_to_user_id_fkey(nome, cognome)').eq('from_user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('company_directors').select('company_id').eq('user_id', profile.id),
    ]);

    if (sentRes.data) setSent(sentRes.data as Message[]);

    // Get applicants from the director's companies
    if (dirRes.data && dirRes.data.length > 0) {
      const companyIds = dirRes.data.map(d => d.company_id);
      const { data: apps } = await supabase
        .from('job_applications')
        .select('user_id, profile:profiles!job_applications_user_id_fkey(id, nome, cognome, email)')
        .in('company_id', companyIds)
        .in('stato', ['VERIFICATA', 'IN_VALUTAZIONE', 'ACCETTATA', 'RESPINTA']);

      const uniqueUsers = new Map<string, Profile>();
      apps?.forEach(a => {
        if (a.profile) uniqueUsers.set(a.user_id, a.profile as unknown as Profile);
      });
      setCompanyUsers(Array.from(uniqueUsers.values()));
    }
    setLoading(false);
  };

  const send = async () => {
    if (!profile || !form.to_user_id || !form.oggetto || !form.contenuto) return;
    setSubmitting(true);
    const { error } = await supabase.from('messages').insert({
      from_user_id: profile.id,
      to_user_id: form.to_user_id,
      oggetto: form.oggetto,
      contenuto: form.contenuto,
      letto: false,
    });
    if (error) {
      toast.error('Errore nell\'invio del messaggio');
    } else {
      await supabase.from('notifications').insert({
        user_id: form.to_user_id,
        titolo: 'Nuovo messaggio',
        descrizione: `Hai ricevuto un messaggio: "${form.oggetto}"`,
        tipo: 'NUOVO_MESSAGGIO',
        letto: false,
      });
      await logAudit({ azione: 'INVIA_MESSAGGIO', entita: 'messages', dettagli: { to: form.to_user_id } });
      toast.success('Messaggio inviato');
      setComposing(false);
      setForm({ to_user_id: '', oggetto: '', contenuto: '' });
      load();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicazioni</h1>
          <p className="text-muted-foreground mt-1">Gestisci le comunicazioni con i candidati</p>
        </div>
        <Button className="gap-2" onClick={() => setComposing(true)}><Send className="h-4 w-4" />Nuovo Messaggio</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Messaggi Inviati</CardTitle></CardHeader>
        <CardContent>
          {sent.length === 0 ? (
            <div className="text-center py-8"><MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nessun messaggio inviato</p></div>
          ) : (
            <div className="space-y-2">
              {sent.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => setSelected(msg)}>
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-sm">{msg.oggetto}</p>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(msg.created_at)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A: {(msg.to_profile as { nome: string; cognome: string })?.nome} {(msg.to_profile as { nome: string; cognome: string })?.cognome}
                      {msg.letto && <Badge variant="outline" className="ml-2 h-4 text-[10px] px-1">Letto</Badge>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.oggetto}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-secondary/50 rounded-lg p-3">
                <div><p className="text-xs text-muted-foreground">A</p><p className="font-medium">{(selected.to_profile as { nome: string; cognome: string })?.nome} {(selected.to_profile as { nome: string; cognome: string })?.cognome}</p></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{formatDateTime(selected.created_at)}</p></div>
              </div>
              <Separator />
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.contenuto}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={composing} onOpenChange={setComposing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuovo Messaggio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Destinatario *</Label>
              <select
                value={form.to_user_id}
                onChange={e => setForm(f => ({ ...f, to_user_id: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleziona destinatario...</option>
                {companyUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} {u.cognome} — {u.email}</option>
                ))}
              </select>
              {companyUsers.length === 0 && <p className="text-xs text-muted-foreground">Nessun candidato disponibile</p>}
            </div>
            <div className="space-y-2">
              <Label>Oggetto *</Label>
              <Input value={form.oggetto} onChange={e => setForm(f => ({ ...f, oggetto: e.target.value }))} placeholder="Oggetto" />
            </div>
            <div className="space-y-2">
              <Label>Messaggio *</Label>
              <Textarea value={form.contenuto} onChange={e => setForm(f => ({ ...f, contenuto: e.target.value }))} rows={5} placeholder="Scrivi il messaggio..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposing(false)}>Annulla</Button>
            <Button onClick={send} disabled={!form.to_user_id || !form.oggetto || !form.contenuto || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Invia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
