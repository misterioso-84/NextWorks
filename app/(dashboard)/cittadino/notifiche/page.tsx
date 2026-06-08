'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TIPO_ICONS: Record<string, string> = {
  CANDIDATURA_INVIATA: '📤',
  RICHIESTA_VERIFICATA: '✅',
  RICHIESTA_RESPINTA: '❌',
  RICHIESTA_APPROVATA: '🎉',
  NUOVO_MESSAGGIO: '✉️',
  CAMBIO_STATO: '🔄',
  AGGIORNAMENTO_ADMIN: 'ℹ️',
};

export default function NotifichePage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    load();

    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ letto: true }).eq('user_id', profile.id).eq('letto', false);
    setNotifications(prev => prev.map(n => ({ ...n, letto: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ letto: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, letto: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.letto).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Notifiche</h1>
            {unreadCount > 0 && <Badge>{unreadCount} nuove</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">Tutti gli aggiornamenti e comunicazioni del sistema</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Segna tutte come lette
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Nessuna notifica</h3>
            <p className="text-muted-foreground mt-1">Non hai notifiche da visualizzare</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`transition-all cursor-pointer hover:shadow-sm ${!n.letto ? 'border-primary/30 bg-primary/5' : ''}`}
              onClick={() => !n.letto && markRead(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5 flex-shrink-0">{TIPO_ICONS[n.tipo] || 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.letto ? 'font-semibold' : 'font-medium'}`}>{n.titolo}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.letto && <div className="w-2 h-2 rounded-full bg-primary" />}
                        <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.descrizione}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
