'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import type { JobApplication, Notification, Message } from '@/lib/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, FileText, Bell, MessageSquare, ArrowRight,
  CheckCircle2, Clock, XCircle, TrendingUp
} from 'lucide-react';

export default function CittadinoDashboard() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasCurriculum, setHasCurriculum] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const [appsRes, notifRes, msgRes, currRes] = await Promise.all([
        supabase.from('job_applications').select('*, company:companies(nome, settore, logo_url)').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('messages').select('*, from_profile:profiles!messages_from_user_id_fkey(nome, cognome)').eq('to_user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('curricula').select('id').eq('user_id', profile.id).maybeSingle(),
      ]);
      if (appsRes.data) setApplications(appsRes.data as JobApplication[]);
      if (notifRes.data) setNotifications(notifRes.data as Notification[]);
      if (msgRes.data) setMessages(msgRes.data as Message[]);
      setHasCurriculum(!!currRes.data);
      setLoading(false);
    };
    load();
  }, [profile]);

  const activeApp = applications.find(a => ['IN_VERIFICA', 'VERIFICATA', 'IN_VALUTAZIONE'].includes(a.stato));
  const accepted = applications.filter(a => a.stato === 'ACCETTATA').length;
  const rejected = applications.filter(a => a.stato === 'RESPINTA').length;
  const unreadNotifs = notifications.filter(n => !n.letto).length;
  const unreadMessages = messages.filter(m => !m.letto).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Benvenuto, {profile?.nome}!</h1>
        <p className="text-muted-foreground mt-1">Ecco il riepilogo della tua situazione</p>
      </div>

      {!hasCurriculum && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Curriculum non ancora compilato</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Compila il tuo curriculum per poter inviare candidature</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Link href="/cittadino/curriculum">Compila ora</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Candidature Totali" value={applications.length} icon={Briefcase} color="blue" />
        <StatCard title="Candidatura Attiva" value={activeApp ? '1' : '0'} icon={Clock} color="amber" />
        <StatCard title="Accettate" value={accepted} icon={CheckCircle2} color="green" />
        <StatCard title="Notifiche Nuove" value={unreadNotifs} icon={Bell} color={unreadNotifs > 0 ? 'red' : 'slate'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Application */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Candidatura Attiva</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Link href="/cittadino/candidature">Tutte <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeApp ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{(activeApp.company as { nome: string })?.nome}</p>
                    <p className="text-xs text-muted-foreground">{(activeApp.company as { settore: string })?.settore}</p>
                  </div>
                  <ApplicationStatusBadge status={activeApp.stato} />
                </div>
                <p className="text-xs text-muted-foreground">Inviata il {formatDateTime(activeApp.created_at)}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessuna candidatura attiva</p>
                {hasCurriculum && (
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/cittadino/candidature">Invia candidatura</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifiche Recenti</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Link href="/cittadino/notifiche">Tutte <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessuna notifica</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${!n.letto ? 'bg-primary/5' : ''}`}>
                    {!n.letto && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate">{n.titolo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.descrizione}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Messaggi Ricevuti</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Link href="/cittadino/messaggi">Tutti <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessun messaggio ricevuto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 4).map(m => (
                  <div key={m.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${!m.letto ? 'bg-primary/5' : ''}`}>
                    {!m.letto && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate">{m.oggetto}</p>
                      <p className="text-xs text-muted-foreground">
                        da {(m.from_profile as { nome: string; cognome: string })?.nome} {(m.from_profile as { nome: string; cognome: string })?.cognome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Storico Candidature</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nessuna candidatura inviata</p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{(a.company as { nome: string })?.nome}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                    </div>
                    <ApplicationStatusBadge status={a.stato} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
