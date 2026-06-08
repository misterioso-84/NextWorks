'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { JobApplication, Company } from '@/lib/types';
import { ACTIVE_APPLICATION_STATUSES } from '@/lib/constants';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { formatDateTime } from '@/lib/utils';
import { Briefcase, Plus, Building, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CandidaturePage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hasCurriculum, setHasCurriculum] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const hasActiveApp = applications.some(a => ACTIVE_APPLICATION_STATUSES.includes(a.stato));

  useEffect(() => {
    if (!profile) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    const [appsRes, companiesRes, currRes] = await Promise.all([
      supabase.from('job_applications').select('*, company:companies(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('companies').select('*').eq('stato', 'ATTIVA').order('nome'),
      supabase.from('curricula').select('id, is_bozza').eq('user_id', profile.id).maybeSingle(),
    ]);
    if (appsRes.data) setApplications(appsRes.data as JobApplication[]);
    if (companiesRes.data) setCompanies(companiesRes.data);
    setHasCurriculum(!!currRes.data && !currRes.data.is_bozza);
    setLoading(false);
  };

  const submitApplication = async () => {
    if (!profile || !selectedCompany) return;
    setSubmitting(true);

    // Get curriculum snapshot
    const { data: cv } = await supabase.from('curricula').select('*').eq('user_id', profile.id).maybeSingle();

    if (!cv) {
      toast.error('Curriculum non trovato. Compila prima il curriculum.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('job_applications').insert({
      user_id: profile.id,
      company_id: selectedCompany,
      stato: 'IN_VERIFICA',
      curriculum_snapshot: {
        informazioni_personali: cv.informazioni_personali,
        presentazione: cv.presentazione,
        esperienze_lavorative: cv.esperienze_lavorative,
        formazione: cv.formazione,
        certificazioni: cv.certificazioni,
        competenze: cv.competenze,
        lingue: cv.lingue,
        patenti: cv.patenti,
        disponibilita: cv.disponibilita,
        informazioni_aggiuntive: cv.informazioni_aggiuntive,
      },
    });

    if (error) {
      toast.error('Errore nell\'invio della candidatura');
    } else {
      // Create notification for the applicant
      await supabase.from('notifications').insert({
        user_id: profile.id,
        titolo: 'Candidatura inviata',
        descrizione: 'La tua candidatura è stata inviata con successo ed è ora in fase di verifica.',
        tipo: 'CANDIDATURA_INVIATA',
        letto: false,
      });
      await logAudit({ azione: 'INVIA_CANDIDATURA', entita: 'job_applications', dettagli: { company_id: selectedCompany } });
      toast.success('Candidatura inviata con successo!');
      setShowDialog(false);
      setSelectedCompany('');
      await loadData();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidature</h1>
          <p className="text-muted-foreground mt-1">Gestisci le tue richieste di lavoro</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          disabled={hasActiveApp || !hasCurriculum}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuova Candidatura
        </Button>
      </div>

      {!hasCurriculum && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Per inviare una candidatura devi prima compilare e pubblicare il tuo curriculum.
          </AlertDescription>
        </Alert>
      )}

      {hasActiveApp && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Hai già una candidatura attiva. Puoi inviarne una nuova solo dopo la conclusione dell&apos;attuale.
          </AlertDescription>
        </Alert>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Nessuna candidatura</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">Non hai ancora inviato nessuna candidatura. Seleziona un&apos;azienda per iniziare.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{(app.company as Company)?.nome}</p>
                      <p className="text-sm text-muted-foreground">{(app.company as Company)?.settore}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Inviata il {formatDateTime(app.created_at)}
                        {app.verified_at && ` · Verificata il ${formatDateTime(app.verified_at)}`}
                      </p>
                      {app.motivazione_rigetto && (
                        <p className="text-xs text-red-600 mt-1 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                          Motivo: {app.motivazione_rigetto}
                        </p>
                      )}
                    </div>
                  </div>
                  <ApplicationStatusBadge status={app.stato} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Application Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Candidatura</DialogTitle>
            <DialogDescription>
              Seleziona l&apos;azienda a cui vuoi candidarti. Il tuo curriculum verrà allegato automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Seleziona Azienda</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un'azienda..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="none" disabled>Nessuna azienda attiva disponibile</SelectItem>
                  ) : (
                    companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col">
                          <span>{c.nome}</span>
                          {c.settore && <span className="text-xs text-muted-foreground">{c.settore} · {c.localita}</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCompany && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                  Il tuo curriculum attuale verrà allegato automaticamente alla candidatura.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setSelectedCompany(''); }}>Annulla</Button>
            <Button onClick={submitApplication} disabled={!selectedCompany || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Invia Candidatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
