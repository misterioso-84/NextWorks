'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { Profile, Employee } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { UserCheck, Plus, UserX, Search, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';

export default function AmministratoreDipendentiPage() {
  const { profile: adminProfile } = useAuth();
  const [employees, setEmployees] = useState<(Employee & { profile: Profile })[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [empRes, usersRes] = await Promise.all([
      supabase.from('employees').select('*, profile:profiles!employees_user_id_fkey(*)').eq('is_active', true),
      supabase.from('profiles').select('*').eq('role', 'DIPENDENTE').order('cognome'),
    ]);
    if (empRes.data) setEmployees(empRes.data as (Employee & { profile: Profile })[]);
    // All users who are not already employees (for adding)
    const empIds = new Set(empRes.data?.map(e => e.user_id));
    const { data: citizenUsers } = await supabase.from('profiles').select('*').in('role', ['CITTADINO', 'DIPENDENTE']).order('cognome');
    if (citizenUsers) setAllUsers(citizenUsers.filter(u => !empIds.has(u.id)) as Profile[]);
    setLoading(false);
  };

  const addEmployee = async () => {
    if (!selectedUserId || !adminProfile) return;
    setSubmitting(true);

    // Update role to DIPENDENTE
    await supabase.from('profiles').update({ role: 'DIPENDENTE' }).eq('id', selectedUserId);

    // Add to employees table
    const { error } = await supabase.from('employees').upsert({
      user_id: selectedUserId,
      assigned_by: adminProfile.id,
      is_active: true,
    });

    if (error) {
      toast.error('Errore nell\'aggiunta del dipendente');
    } else {
      await logAudit({ azione: 'AGGIUNGI_DIPENDENTE', entita: 'employees', dettagli: { userId: selectedUserId } });
      toast.success('Dipendente aggiunto con successo');
      setShowAdd(false);
      setSelectedUserId('');
      load();
    }
    setSubmitting(false);
  };

  const removeEmployee = async (emp: Employee & { profile: Profile }) => {
    const { error } = await supabase.from('employees').update({ is_active: false }).eq('id', emp.id);
    if (!error) {
      await supabase.from('profiles').update({ role: 'CITTADINO' }).eq('id', emp.user_id);
      await logAudit({ azione: 'RIMUOVI_DIPENDENTE', entita: 'employees', entita_id: emp.id });
      toast.success('Dipendente rimosso');
      load();
    } else {
      toast.error('Errore nella rimozione');
    }
  };

  const filtered = employees.filter(e => {
    const p = e.profile;
    return !search || `${p?.nome} ${p?.cognome} ${p?.email}`.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Dipendenti</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} dipendenti attivi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Aggiungi Dipendente</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cerca dipendente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(emp => (
          <Card key={emp.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-semibold text-blue-700 dark:text-blue-300 flex-shrink-0">
                    {emp.profile?.nome?.[0]}{emp.profile?.cognome?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{emp.profile?.nome} {emp.profile?.cognome}</p>
                    <p className="text-sm text-muted-foreground">{emp.profile?.email}</p>
                    <p className="text-xs text-muted-foreground">Aggiunto il {formatDate(emp.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Dipendente</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => removeEmployee(emp)}
                  >
                    <UserX className="h-3.5 w-3.5" />Rimuovi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessun dipendente trovato</p>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Dipendente</DialogTitle>
            <DialogDescription>Seleziona un utente da promuovere a dipendente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Seleziona Utente</Label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Scegli un utente...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} {u.cognome} — {u.email}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annulla</Button>
            <Button onClick={addEmployee} disabled={!selectedUserId || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
