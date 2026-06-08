'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuditLog, Profile } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { ScrollText, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  INVIA_CANDIDATURA: 'bg-green-100 text-green-700',
  APPROVA_CANDIDATURA: 'bg-green-100 text-green-700',
  RIFIUTA_CANDIDATURA: 'bg-red-100 text-red-700',
  CAMBIA_STATO_CANDIDATURA: 'bg-amber-100 text-amber-700',
  CREA_AZIENDA: 'bg-blue-100 text-blue-700',
  MODIFICA_AZIENDA: 'bg-amber-100 text-amber-700',
  INVIA_MESSAGGIO: 'bg-purple-100 text-purple-700',
  CAMBIA_RUOLO_UTENTE: 'bg-red-100 text-red-700',
  AGGIUNGI_DIPENDENTE: 'bg-blue-100 text-blue-700',
  RIMUOVI_DIPENDENTE: 'bg-red-100 text-red-700',
  AGGIUNGI_DIREZIONE: 'bg-amber-100 text-amber-700',
  PUBBLICA_CURRICULUM: 'bg-green-100 text-green-700',
  MODIFICA_PROFILO: 'bg-slate-100 text-slate-600',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profile:profiles!audit_logs_user_id_fkey(nome, cognome, email)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (data) setLogs(data as AuditLog[]);
    setLoading(false);
  };

  const filtered = logs.filter(log => {
    if (!search) return true;
    const p = log.profile as Profile;
    return log.azione.toLowerCase().includes(search.toLowerCase()) ||
      `${p?.nome} ${p?.cognome}`.toLowerCase().includes(search.toLowerCase()) ||
      (log.entita || '').toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Registro completo delle attività di sistema</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}>
          <RefreshCw className="h-4 w-4" />Aggiorna
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cerca azione, utente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        {filtered.map(log => {
          const p = log.profile as Profile;
          return (
            <Card key={log.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.azione] || 'bg-slate-100 text-slate-600'}`}>
                        {log.azione.replace(/_/g, ' ')}
                      </span>
                      {log.entita && (
                        <Badge variant="outline" className="text-xs h-4">{log.entita}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {p ? (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{p.nome} {p.cognome}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sistema</p>
                      )}
                      <span className="text-muted-foreground">·</span>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                    </div>
                    {Object.keys(log.dettagli || {}).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/50 px-2 py-0.5 rounded truncate">
                        {JSON.stringify(log.dettagli)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessun log trovato</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          Precedente
        </Button>
        <span className="text-sm text-muted-foreground">Pagina {page + 1}</span>
        <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
          Successiva
        </Button>
      </div>
    </div>
  );
}
