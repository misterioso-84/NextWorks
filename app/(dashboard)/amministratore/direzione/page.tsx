'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { Profile, Company, CompanyDirector } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Building2, Plus, Trash2, Search, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';

export default function AmministratoreDirezionePage() {
  const { profile: adminProfile } = useAuth();
  const [directors, setDirectors] = useState<(CompanyDirector & { profile: Profile; company: Company })[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ user_id: '', company_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [dirRes, usersRes, compRes] = await Promise.all([
      supabase.from('company_directors').select('*, profile:profiles!company_directors_user_id_fkey(*), company:companies(*)'),
      supabase.from('profiles').select('id, nome, cognome, email, role').order('cognome'),
      supabase.from('companies').select('id, nome, stato').order('nome'),
    ]);
    if (dirRes.data) setDirectors(dirRes.data as (CompanyDirector & { profile: Profile; company: Company })[]);
    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (compRes.data) setCompanies(compRes.data as Company[]);
    setLoading(false);
  };

  const addDirector = async () => {
    if (!form.user_id || !form.company_id || !adminProfile) return;
    setSubmitting(true);

    // Update role to DIREZIONE
    await supabase.from('profiles').update({ role: 'DIREZIONE' }).eq('id', form.user_id);

    const { error } = await supabase.from('company_directors').insert({
      user_id: form.user_id,
      company_id: form.company_id,
      assigned_by: adminProfile.id,
    });

    if (error) {
      if (error.message.includes('unique')) {
        toast.error('Questo utente è già membro della direzione di questa azienda');
      } else {
        toast.error('Errore nell\'aggiunta del membro della direzione');
      }
    } else {
      await logAudit({ azione: 'AGGIUNGI_DIREZIONE', entita: 'company_directors', dettagli: form });
      toast.success('Membro della direzione aggiunto');
      setShowAdd(false);
      setForm({ user_id: '', company_id: '' });
      load();
    }
    setSubmitting(false);
  };

  const removeDirector = async (dir: CompanyDirector) => {
    const { error } = await supabase.from('company_directors').delete().eq('id', dir.id);
    if (!error) {
      await logAudit({ azione: 'RIMUOVI_DIREZIONE', entita: 'company_directors', entita_id: dir.id });
      toast.success('Membro rimosso dalla direzione');
      load();
    } else {
      toast.error('Errore nella rimozione');
    }
  };

  const filtered = directors.filter(d => {
    const p = d.profile;
    const c = d.company;
    return !search ||
      `${p?.nome} ${p?.cognome} ${p?.email} ${c?.nome}`.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Direzione Aziendale</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} membri della direzione</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Aggiungi Membro</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cerca per nome o azienda..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(dir => (
          <Card key={dir.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center font-semibold text-amber-700 dark:text-amber-300 flex-shrink-0">
                    {dir.profile?.nome?.[0]}{dir.profile?.cognome?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{dir.profile?.nome} {dir.profile?.cognome}</p>
                    <p className="text-sm text-muted-foreground">{dir.profile?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{dir.company?.nome}</Badge>
                      <span className="text-xs text-muted-foreground">dal {formatDate(dir.created_at)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => removeDirector(dir)}
                >
                  <Trash2 className="h-3.5 w-3.5" />Rimuovi
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessun membro della direzione trovato</p>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Membro Direzione</DialogTitle>
            <DialogDescription>Assegna un utente alla direzione di un&apos;azienda</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Utente</Label>
              <select
                value={form.user_id}
                onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleziona utente...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} {u.cognome} — {u.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Azienda</Label>
              <select
                value={form.company_id}
                onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleziona azienda...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annulla</Button>
            <Button onClick={addDirector} disabled={!form.user_id || !form.company_id || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
