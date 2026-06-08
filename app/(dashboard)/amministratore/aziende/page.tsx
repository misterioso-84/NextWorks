'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { Company } from '@/lib/types';
import { COMPANY_STATUS_LABELS, COMPANY_STATUS_COLORS, SETTORI_AZIENDALI } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { Building, Plus, Edit2, MapPin, Briefcase, RefreshCw, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompanyStatus } from '@/lib/types';

const companySchema = z.object({
  nome: z.string().min(2, 'Almeno 2 caratteri'),
  descrizione: z.string().optional(),
  settore: z.string().optional(),
  localita: z.string().optional(),
  data_adesione: z.string().optional(),
  stato: z.enum(['ATTIVA', 'INATTIVA', 'IN_SOSPESO']),
});

type CompanyForm = z.infer<typeof companySchema>;

export default function AmministratoreAziendePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { stato: 'IN_SOSPESO' },
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (data) setCompanies(data);
    setLoading(false);
  };

  const openAdd = () => {
    reset({ stato: 'IN_SOSPESO' });
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (company: Company) => {
    reset({
      nome: company.nome,
      descrizione: company.descrizione || '',
      settore: company.settore || '',
      localita: company.localita || '',
      data_adesione: company.data_adesione || '',
      stato: company.stato,
    });
    setEditingId(company.id);
    setShowDialog(true);
  };

  const onSubmit = async (data: CompanyForm) => {
    setSubmitting(true);
    let error;
    if (editingId) {
      ({ error } = await supabase.from('companies').update(data).eq('id', editingId));
      if (!error) await logAudit({ azione: 'MODIFICA_AZIENDA', entita: 'companies', entita_id: editingId });
    } else {
      ({ error } = await supabase.from('companies').insert(data));
      if (!error) await logAudit({ azione: 'CREA_AZIENDA', entita: 'companies', dettagli: { nome: data.nome } });
    }

    if (error) {
      toast.error('Errore nel salvataggio dell\'azienda');
    } else {
      toast.success(editingId ? 'Azienda aggiornata' : 'Azienda creata con successo');
      setShowDialog(false);
      load();
    }
    setSubmitting(false);
  };

  const filtered = companies.filter(c => {
    const matchesSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.settore || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.stato === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Aziende</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} aziende nel sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={load}><RefreshCw className="h-4 w-4" />Aggiorna</Button>
          <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" />Nuova Azienda</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca azienda..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {(Object.entries(COMPANY_STATUS_LABELS) as [CompanyStatus, string][]).map(([s, l]) => (
              <SelectItem key={s} value={s}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(company => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{company.nome}</p>
                    <span className={cn('inline-flex text-xs px-2 py-0.5 rounded-full border mt-1', COMPANY_STATUS_COLORS[company.stato])}>
                      {COMPANY_STATUS_LABELS[company.stato]}
                    </span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => openEdit(company)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {company.descrizione && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{company.descrizione}</p>
              )}
              <div className="mt-3 space-y-1.5">
                {company.settore && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{company.settore}</div>}
                {company.localita && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{company.localita}</div>}
                {company.data_adesione && <p className="text-xs text-muted-foreground">Adesione: {formatDate(company.data_adesione)}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessuna azienda trovata</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifica Azienda' : 'Nuova Azienda'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome Azienda *</Label>
              <Input {...register('nome')} className={errors.nome ? 'border-destructive' : ''} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea {...register('descrizione')} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Settore</Label>
                <select
                  {...register('settore')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleziona...</option>
                  {SETTORI_AZIENDALI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Stato</Label>
                <select
                  {...register('stato')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.entries(COMPANY_STATUS_LABELS) as [CompanyStatus, string][]).map(([s, l]) => (
                    <option key={s} value={s}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Località</Label>
                <Input {...register('localita')} placeholder="Città" />
              </div>
              <div className="space-y-2">
                <Label>Data Adesione</Label>
                <Input type="date" {...register('data_adesione')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annulla</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Salva Modifiche' : 'Crea Azienda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
