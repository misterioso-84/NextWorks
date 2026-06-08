'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { JobApplication, Profile, Company } from '@/lib/types';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { CurriculumPreview } from '@/components/curriculum/curriculum-preview';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { FileText, MessageSquare, User, RefreshCw, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApplicationStatus } from '@/lib/types';

const MANAGEABLE_STATUSES: ApplicationStatus[] = ['IN_VALUTAZIONE', 'ACCETTATA', 'RESPINTA'];

export default function DirezioneCandidaturePage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [showCv, setShowCv] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [messageForm, setMessageForm] = useState({ oggetto: '', contenuto: '' });
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('IN_VALUTAZIONE');
  const [statusNote, setStatusNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    const { data: dirData } = await supabase
      .from('company_directors')
      .select('company_id')
      .eq('user_id', profile.id);

    const companyIds = dirData?.map(d => d.company_id) || [];
    if (companyIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from('job_applications')
      .select(`
        *,
        profile:profiles!job_applications_user_id_fkey(id, nome, cognome, codice_fiscale, email, telefono, telegram),
        company:companies(id, nome, settore)
      `)
      .in('company_id', companyIds)
      .in('stato', ['VERIFICATA', 'IN_VALUTAZIONE', 'ACCETTATA', 'RESPINTA'])
      .order('created_at', { ascending: false });

    if (data) setApplications(data as JobApplication[]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!selected || !profile) return;
    setSubmitting(true);
    const appProfile = selected.profile as Profile;

    const { error } = await supabase.from('messages').insert({
      from_user_id: profile.id,
      to_user_id: appProfile.id,
      application_id: selected.id,
      oggetto: messageForm.oggetto,
      contenuto: messageForm.contenuto,
      letto: false,
    });

    if (error) {
      toast.error('Errore nell\'invio del messaggio');
    } else {
      await supabase.from('notifications').insert({
        user_id: appProfile.id,
        titolo: 'Nuovo messaggio ricevuto',
        descrizione: `Hai ricevuto un messaggio: "${messageForm.oggetto}"`,
        tipo: 'NUOVO_MESSAGGIO',
        application_id: selected.id,
        letto: false,
      });
      await logAudit({ azione: 'INVIA_MESSAGGIO', entita: 'messages', dettagli: { to: appProfile.id } });
      toast.success('Messaggio inviato');
      setShowMessage(false);
      setMessageForm({ oggetto: '', contenuto: '' });
    }
    setSubmitting(false);
  };

  const changeStatus = async () => {
    if (!selected || !profile) return;
    setSubmitting(true);
    const appProfile = selected.profile as Profile;

    const { error } = await supabase.from('job_applications').update({
      stato: newStatus,
      motivazione_rigetto: newStatus === 'RESPINTA' ? statusNote : null,
    }).eq('id', selected.id);

    if (error) {
      toast.error('Errore nel cambio di stato');
    } else {
      if (statusNote.trim()) {
        await supabase.from('application_notes').insert({
          application_id: selected.id,
          user_id: profile.id,
          contenuto: statusNote,
        });
      }
      await supabase.from('notifications').insert({
        user_id: appProfile.id,
        titolo: 'Aggiornamento candidatura',
        descrizione: `Lo stato della tua candidatura è cambiato in: ${APPLICATION_STATUS_LABELS[newStatus]}`,
        tipo: 'CAMBIO_STATO',
        application_id: selected.id,
        letto: false,
      });
      await logAudit({ azione: 'CAMBIA_STATO_CANDIDATURA', entita: 'job_applications', entita_id: selected.id, dettagli: { newStatus } });
      toast.success('Stato aggiornato');
      setShowStatusChange(false);
      setStatusNote('');
      await load();
    }
    setSubmitting(false);
  };

  const filtered = applications.filter(a => {
    const appProfile = a.profile as Profile;
    const matchesStatus = filterStatus === 'all' || a.stato === filterStatus;
    const matchesSearch = !search ||
      `${appProfile?.nome} ${appProfile?.cognome}`.toLowerCase().includes(search.toLowerCase()) ||
      appProfile?.codice_fiscale?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Candidature</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} candidature trovate</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Cerca candidato..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="VERIFICATA">Verificata</SelectItem>
            <SelectItem value="IN_VALUTAZIONE">In Valutazione</SelectItem>
            <SelectItem value="ACCETTATA">Accettata</SelectItem>
            <SelectItem value="RESPINTA">Respinta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nessuna candidatura trovata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const appProfile = app.profile as Profile;
            const company = app.company as Company;
            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{appProfile?.nome} {appProfile?.cognome}</p>
                        <p className="text-sm text-muted-foreground">{company?.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(app.created_at)}</p>
                        {app.motivazione_rigetto && (
                          <p className="text-xs text-red-600 mt-1">Motivo: {app.motivazione_rigetto}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ApplicationStatusBadge status={app.stato} />
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setSelected(app); setShowCv(true); }}>
                        <FileText className="h-3.5 w-3.5" />CV
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setSelected(app); setNewStatus(app.stato); setShowStatusChange(true); }}>
                        Stato
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setSelected(app); setMessageForm({ oggetto: '', contenuto: '' }); setShowMessage(true); }}>
                        <MessageSquare className="h-3.5 w-3.5" />Messaggio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CV Dialog */}
      <Dialog open={showCv} onOpenChange={() => { setShowCv(false); setSelected(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Curriculum Vitae</DialogTitle></DialogHeader>
          {selected?.curriculum_snapshot && selected.profile && (
            <CurriculumPreview
              data={selected.curriculum_snapshot as Parameters<typeof CurriculumPreview>[0]['data']}
              profile={selected.profile as Profile}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChange} onOpenChange={() => setShowStatusChange(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambia Stato Candidatura</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nuovo Stato</Label>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MANAGEABLE_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note {newStatus === 'RESPINTA' ? '(obbligatorio)' : '(opzionale)'}</Label>
              <Textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Aggiungi una nota..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChange(false)}>Annulla</Button>
            <Button onClick={changeStatus} disabled={(newStatus === 'RESPINTA' && !statusNote.trim()) || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Aggiorna Stato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessage} onOpenChange={() => setShowMessage(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invia Messaggio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {selected && (
              <p className="text-sm text-muted-foreground">
                A: <span className="font-medium text-foreground">{(selected.profile as Profile)?.nome} {(selected.profile as Profile)?.cognome}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Oggetto *</Label>
              <Input value={messageForm.oggetto} onChange={e => setMessageForm(f => ({ ...f, oggetto: e.target.value }))} placeholder="Oggetto del messaggio" />
            </div>
            <div className="space-y-2">
              <Label>Messaggio *</Label>
              <Textarea value={messageForm.contenuto} onChange={e => setMessageForm(f => ({ ...f, contenuto: e.target.value }))} placeholder="Scrivi il messaggio..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessage(false)}>Annulla</Button>
            <Button onClick={sendMessage} disabled={!messageForm.oggetto || !messageForm.contenuto || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Invia Messaggio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
