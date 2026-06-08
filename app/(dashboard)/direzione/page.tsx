'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { JobApplication, Company } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { formatDateTime } from '@/lib/utils';
import { Briefcase, CheckCircle, XCircle, Clock, Building, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DirezioneDashboard() {
  const { profile } = useAuth();
  const [myCompanies, setMyCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      // Get companies for this director
      const { data: dirData } = await supabase
        .from('company_directors')
        .select('company:companies(*)')
        .eq('user_id', profile.id);

      const companies = ((dirData?.map(d => d.company).filter(Boolean)) as unknown as Company[]) || [];
      setMyCompanies(companies);

      if (companies.length > 0) {
        const companyIds = companies.map(c => c.id);
        const { data: appsData } = await supabase
          .from('job_applications')
          .select('*, profile:profiles!job_applications_user_id_fkey(nome, cognome), company:companies(nome)')
          .in('company_id', companyIds)
          .in('stato', ['VERIFICATA', 'IN_VALUTAZIONE', 'ACCETTATA', 'RESPINTA'])
          .order('created_at', { ascending: false })
          .limit(10);
        if (appsData) setApplications(appsData as JobApplication[]);
      }
      setLoading(false);
    };
    load();
  }, [profile]);

  const stats = {
    total: applications.length,
    inValutazione: applications.filter(a => a.stato === 'IN_VALUTAZIONE').length,
    accettate: applications.filter(a => a.stato === 'ACCETTATA').length,
    respinte: applications.filter(a => a.stato === 'RESPINTA').length,
  };

  const chartData = [
    { name: 'In Valutazione', value: stats.inValutazione, fill: '#f59e0b' },
    { name: 'Accettate', value: stats.accettate, fill: '#10b981' },
    { name: 'Respinte', value: stats.respinte, fill: '#ef4444' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Direzione</h1>
        <p className="text-muted-foreground mt-1">Panoramica candidature aziendali</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Totale Candidature" value={stats.total} icon={Briefcase} color="blue" />
        <StatCard title="In Valutazione" value={stats.inValutazione} icon={Clock} color="amber" />
        <StatCard title="Accettate" value={stats.accettate} icon={CheckCircle} color="green" />
        <StatCard title="Respinte" value={stats.respinte} icon={XCircle} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Companies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Le Mie Aziende</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Link href="/direzione/aziende">Vedi <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {myCompanies.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-lg border">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.settore}</p>
                </div>
              </div>
            ))}
            {myCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna azienda assegnata</p>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuzione Candidature</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Candidature']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Candidature Recenti</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Link href="/direzione/candidature">Tutte <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessuna candidatura ricevuta</p>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 6).map(app => (
                <div key={app.id} className="flex items-center justify-between gap-3 p-2.5 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {(app.profile as { nome: string; cognome: string })?.nome} {(app.profile as { nome: string; cognome: string })?.cognome}
                    </p>
                    <p className="text-xs text-muted-foreground">{(app.company as { nome: string })?.nome} · {formatDateTime(app.created_at)}</p>
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
