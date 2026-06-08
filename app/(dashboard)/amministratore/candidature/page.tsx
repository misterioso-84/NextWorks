'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { JobApplication, Profile, Company } from '@/lib/types';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { formatDateTime } from '@/lib/utils';
import { Briefcase, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';
import type { ApplicationStatus } from '@/lib/types';

export default function AmministratoreCandidaturePage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from('job_applications')
      .select(`
        *,
        profile:profiles!job_applications_user_id_fkey(nome, cognome, codice_fiscale),
        company:companies(nome, settore)
      `)
      .order('created_at', { ascending: false });
    if (data) setApplications(data as JobApplication[]);
    setLoading(false);
  };

  const filtered = applications.filter(a => {
    const p = a.profile as Profile;
    const c = a.company as Company;
    const matchesSearch = !search ||
      `${p?.nome} ${p?.cognome} ${p?.codice_fiscale} ${c?.nome}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.stato === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutte le Candidature</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} candidature trovate</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca candidato, CF, azienda..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(([s, l]) => (
              <SelectItem key={s} value={s}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(app => {
          const p = app.profile as Profile;
          const c = app.company as Company;
          return (
            <Card key={app.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium">{p?.nome} {p?.cognome}</p>
                    <p className="text-sm text-muted-foreground">{c?.nome} · {c?.settore}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p?.codice_fiscale} · {formatDateTime(app.created_at)}</p>
                    {app.motivazione_rigetto && (
                      <p className="text-xs text-red-600 mt-1">Motivo: {app.motivazione_rigetto}</p>
                    )}
                  </div>
                  <ApplicationStatusBadge status={app.stato} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessuna candidatura trovata</p>
          </div>
        )}
      </div>
    </div>
  );
}
