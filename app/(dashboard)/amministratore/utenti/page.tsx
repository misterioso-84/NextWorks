'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { Users, Search, Shield, UserX, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@/lib/types';

export default function AmministratoreUtentiPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('CITTADINO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const changeRole = async () => {
    if (!selected) return;
    setSubmitting(true);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selected.id);
    if (error) {
      toast.error('Errore nel cambio di ruolo');
    } else {
      await logAudit({ azione: 'CAMBIA_RUOLO_UTENTE', entita: 'profiles', entita_id: selected.id, dettagli: { oldRole: selected.role, newRole } });
      toast.success(`Ruolo aggiornato a ${ROLE_LABELS[newRole]}`);
      setShowRoleDialog(false);
      setSelected(null);
      load();
    }
    setSubmitting(false);
  };

  const toggleActive = async (user: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    if (error) {
      toast.error('Errore nel cambio di stato');
    } else {
      await logAudit({ azione: user.is_active ? 'DISATTIVA_UTENTE' : 'ATTIVA_UTENTE', entita: 'profiles', entita_id: user.id });
      toast.success(user.is_active ? 'Utente disattivato' : 'Utente attivato');
      load();
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      `${u.nome} ${u.cognome} ${u.email} ${u.codice_fiscale}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Utenti</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} utenti nel sistema</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca per nome, email, CF..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtra per ruolo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i ruoli</SelectItem>
            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
              <SelectItem key={role} value={role}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(user => (
          <Card key={user.id} className={cn('hover:shadow-sm transition-shadow', !user.is_active && 'opacity-60')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                    {user.nome[0]}{user.cognome[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{user.nome} {user.cognome}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</span>
                      {!user.is_active && <Badge variant="destructive" className="h-4 text-[10px] px-1.5">Disattivo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.codice_fiscale} · {formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => { setSelected(user); setNewRole(user.role); setShowRoleDialog(true); }}
                  >
                    <Shield className="h-3.5 w-3.5" />Ruolo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn('h-8 gap-1.5', user.is_active ? 'text-red-700 border-red-300 hover:bg-red-50' : 'text-green-700 border-green-300 hover:bg-green-50')}
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    {user.is_active ? 'Disattiva' : 'Attiva'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessun utente trovato</p>
          </div>
        )}
      </div>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Ruolo Utente</DialogTitle>
            <DialogDescription>
              Stai cambiando il ruolo di {selected?.nome} {selected?.cognome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nuovo Ruolo</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
                    <SelectItem key={role} value={role}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Annulla</Button>
            <Button onClick={changeRole} disabled={submitting || newRole === selected?.role}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
