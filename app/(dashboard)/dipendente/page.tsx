'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { JobApplication } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { formatDateTime } from '@/lib/utils';
import { ClipboardCheck, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DipendenteDashboard() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<JobApplication[]>([]);
  const [verified, setVerified] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: pendingData } = await supabase
        .from('job_applications')
        .select('*, profile:profiles!job_applications_user_id_fkey(nome, cognome, codice_fiscale), company:companies(nome)')
        .eq('stato', 'IN_VERIFICA')
        .order('created_at', { ascending: true })
        .limit(5);

      const { count: verCount } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('stato', 'VERIFICATA');

      const { count: rejCount } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('verified_by', profile?.id);

      if (pendingData) setPending(pendingData as JobApplication[]);
      setVerified(verCount || 0);
      setRejected(rejCount || 0);
      setLoading(false);
    };
    if (profile) load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Dipendente</h1>
        <p className="text-muted-foreground mt-1">Gestisci le verifiche delle candidature</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="In Attesa di Verifica" value={pending.length} icon={Clock} color="amber" />
        <StatCard title="Verificate" value={verified} icon={CheckCircle} color="green" />
        <StatCard title="Da Te Elaborate" value={rejected} icon={ClipboardCheck} color="blue" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Candidature in Attesa di Verifica</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Link href="/dipendente/verifiche">Tutte <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nessuna candidatura in attesa di verifica</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map(app => (
                <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 border rounded-lg hover:bg-secondary/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      {(app.profile as { nome: string; cognome: string })?.nome} {(app.profile as { nome: string; cognome: string })?.cognome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(app.company as { nome: string })?.nome} · {formatDateTime(app.created_at)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={app.stato} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
