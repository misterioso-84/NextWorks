'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StatCard } from '@/components/dashboard/stat-card';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';
import {
  Users, Building, Briefcase, CheckCircle, XCircle, UserCheck,
  Building2, Clock, TrendingUp, BarChart3, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  pendingCompanies: number;
  totalApplications: number;
  pendingVerification: number;
  accepted: number;
  rejected: number;
  employees: number;
  directors: number;
}

export default function AmministratoreDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: totalUsers },
        { count: totalCompanies },
        { count: activeCompanies },
        { count: inactiveCompanies },
        { count: pendingCompanies },
        { count: totalApplications },
        { count: pendingVerification },
        { count: accepted },
        { count: rejected },
        { count: employees },
        { count: directors },
        { data: logs },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('stato', 'ATTIVA'),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('stato', 'INATTIVA'),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('stato', 'IN_SOSPESO'),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('stato', 'IN_VERIFICA'),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('stato', 'ACCETTATA'),
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('stato', 'RESPINTA'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('company_directors').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*, profile:profiles!audit_logs_user_id_fkey(nome, cognome)').order('created_at', { ascending: false }).limit(8),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalCompanies: totalCompanies || 0,
        activeCompanies: activeCompanies || 0,
        inactiveCompanies: inactiveCompanies || 0,
        pendingCompanies: pendingCompanies || 0,
        totalApplications: totalApplications || 0,
        pendingVerification: pendingVerification || 0,
        accepted: accepted || 0,
        rejected: rejected || 0,
        employees: employees || 0,
        directors: directors || 0,
      });

      if (logs) setRecentActivity(logs as AuditLog[]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}</div>
      </div>
    );
  }

  const companyChartData = [
    { name: 'Attive', value: stats.activeCompanies, fill: '#10b981' },
    { name: 'Inattive', value: stats.inactiveCompanies, fill: '#94a3b8' },
    { name: 'In Sospeso', value: stats.pendingCompanies, fill: '#f59e0b' },
  ];

  const appChartData = [
    { name: 'In Verifica', value: stats.pendingVerification, fill: '#f59e0b' },
    { name: 'Accettate', value: stats.accepted, fill: '#10b981' },
    { name: 'Respinte', value: stats.rejected, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Amministratore</h1>
        <p className="text-muted-foreground mt-1">Panoramica completa del sistema</p>
      </div>

      {/* Users & Companies */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Utenti e Aziende</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Utenti Totali" value={stats.totalUsers} icon={Users} color="blue" />
          <StatCard title="Aziende Totali" value={stats.totalCompanies} icon={Building} color="slate" />
          <StatCard title="Dipendenti Attivi" value={stats.employees} icon={UserCheck} color="green" />
          <StatCard title="Membri Direzione" value={stats.directors} icon={Building2} color="amber" />
        </div>
      </div>

      {/* Applications */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Candidature</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Totali" value={stats.totalApplications} icon={Briefcase} color="blue" />
          <StatCard title="In Verifica" value={stats.pendingVerification} icon={Clock} color="amber" />
          <StatCard title="Accettate" value={stats.accepted} icon={CheckCircle} color="green" />
          <StatCard title="Respinte" value={stats.rejected} icon={XCircle} color="red" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Companies Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stato Aziende</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={companyChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {companyChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Aziende']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stato Candidature</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={appChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Candidature']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {appChartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attività Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nessuna attività registrata</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/30">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{log.azione.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(log.created_at)}</p>
                    </div>
                    {log.profile && (
                      <p className="text-xs text-muted-foreground">
                        da {(log.profile as { nome: string; cognome: string })?.nome} {(log.profile as { nome: string; cognome: string })?.cognome}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
