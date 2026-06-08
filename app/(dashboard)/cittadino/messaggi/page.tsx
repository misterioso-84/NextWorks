'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Loader2, Mail, MailOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function MessaggiPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    if (!profile) return;
    loadMessages();

    const channel = supabase
      .channel('messages-citizen')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user_id=eq.${profile.id}`,
      }, () => loadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadMessages = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('messages')
      .select('*, from_profile:profiles!messages_from_user_id_fkey(nome, cognome, role)')
      .eq('to_user_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  };

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.letto) {
      await supabase.from('messages').update({ letto: true }).eq('id', msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, letto: true } : m));
    }
  };

  const unreadCount = messages.filter(m => !m.letto).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Messaggi</h1>
          {unreadCount > 0 && <Badge>{unreadCount} non letti</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">Comunicazioni ricevute dalla direzione aziendale</p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Nessun messaggio</h3>
            <p className="text-muted-foreground mt-1">Non hai ancora ricevuto messaggi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <Card
              key={msg.id}
              className={`cursor-pointer hover:shadow-md transition-all ${!msg.letto ? 'border-primary/30 bg-primary/5' : ''}`}
              onClick={() => openMessage(msg)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {msg.letto ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${!msg.letto ? 'font-semibold' : ''}`}>{msg.oggetto}</p>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(msg.created_at)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      da {(msg.from_profile as { nome: string; cognome: string })?.nome} {(msg.from_profile as { nome: string; cognome: string })?.cognome}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.contenuto}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.oggetto}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-secondary/50 rounded-lg p-3">
                <div>
                  <p className="text-muted-foreground text-xs">Da</p>
                  <p className="font-medium">{(selected.from_profile as { nome: string; cognome: string })?.nome} {(selected.from_profile as { nome: string; cognome: string })?.cognome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data e Ora</p>
                  <p className="font-medium">{formatDateTime(selected.created_at)}</p>
                </div>
              </div>
              <Separator />
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{selected.contenuto}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
