'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import type { JobApplication, Profile, Curriculum } from '@/lib/types';
import { ApplicationStatusBadge } from '@/components/applications/status-badge';
import { CurriculumPreview } from '@/components/curriculum/curriculum-preview';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle, XCircle, Eye, FileText, User, Building, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VerifichePage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCv, setShowCv] = useState(false);

  useEffect(() => {
    if (profile) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const load = async () => {
    const { data } = await supabase
      .from('job_applications')
      .select(`
        *,
        profile:profiles!job_applications_user_id_fkey(id, nome, cognome, codice_fiscale, email, telefono, telegram),
        company:companies(id, nome, settore, localita)
      `)
      .in('stato', ['IN_VERIFICA'])
      .order('created_at', { ascending: true });
    if (data) setApplications(data as JobApplication[]);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selected || !profile || !action) return;
    setSubmitting(true);

    const newState = action === 'approve' ? 'VERIFICATA' : 'RESPINTA';
    const { error } = await supabase.from('job_applications').update({
      stato: newState,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
      motivazione_rigetto: action === 'reject' ? note : null,
    }).eq('id', selected.id);

    if (error) {
      toast.error('Errore nell\'elaborazione della candidatura');
    } else {
      // Add note if provided
      if (note.trim()) {
        await supabase.from('application_notes').insert({
          application_id: selected.id,
          user_id: profile.id,
          contenuto: note,
        });
      }

      // Notify the applicant
      const appProfile = selected.profile as Profile;
      await supabase.from('notifications').insert({
        user_id: appProfile.id,
        titolo: action === 'approve' ? 'Candidatura verificata' : 'Candidatura respinta',
        descrizione: action === 'approve'
          ? 'La tua candidatura è stata verificata ed è ora in fase di valutazione aziendale.'
          : `La tua candidatura è stata respinta. ${note ? `Motivazione: ${note}` : ''}`,
        tipo: action === 'approve' ? 'RICHIESTA_APPROVATA' : 'RICHIESTA_RESPINTA',
        application_id: selected.id,
        letto: false,
      });

      await logAudit({
        azione: action === 'approve' ? 'APPROVA_CANDIDATURA' : 'RIFIUTA_CANDIDATURA',
        entita: 'job_applications',
        entita_id: selected.id,
        dettagli: { note },
      });

      toast.success(action === 'approve' ? 'Candidatura approvata' : 'Candidatura respinta');
      setSelected(null);
      setAction(null);
      setNote('');
      await load();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifiche Candidature</h1>
          <p className="text-muted-foreground mt-1">
            {applications.length > 0 ? `${applications.length} candidature in attesa di verifica` : 'Nessuna candidatura in attesa'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Aggiorna
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-16 w-16 text-green-500/30 mb-4" />
            <h3 className="text-lg font-semibold">Tutto verificato!</h3>
            <p className="text-muted-foreground mt-1">Non ci sono candidature in attesa di verifica</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const appProfile = app.profile as Profile;
            const company = app.company as { nome: string; settore: string; localita: string };
            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{appProfile?.nome} {appProfile?.cognome}</p>
                        <p className="text-sm text-muted-foreground font-mono">{appProfile?.codice_fiscale}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Building className="h-3 w-3" />{company?.nome}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(app.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ApplicationStatusBadge status={app.stato} />
                      <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => { setSelected(app); setShowCv(true); }}>
                        <FileText className="h-3.5 w-3.5" />CV
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => { setSelected(app); setAction('approve'); setNote(''); }}>
                        <CheckCircle className="h-3.5 w-3.5" />Approva
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => { setSelected(app); setAction('reject'); setNote(''); }}>
                        <XCircle className="h-3.5 w-3.5" />Respingi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CV Preview Dialog */}
      <Dialog open={showCv} onOpenChange={() => { setShowCv(false); setSelected(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Curriculum Vitae</DialogTitle>
          </DialogHeader>
          {selected?.curriculum_snapshot && selected.profile && (
            <CurriculumPreview
              data={selected.curriculum_snapshot as Parameters<typeof CurriculumPreview>[0]['data']}
              profile={selected.profile as Profile}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!action && !!selected && !showCv} onOpenChange={() => { setAction(null); setSelected(null); setNote(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? '✅ Approva Candidatura' : '❌ Respingi Candidatura'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selected && (
              <p className="text-sm text-muted-foreground">
                Stai {action === 'approve' ? 'approvando' : 'respingendo'} la candidatura di{' '}
                <span className="font-medium text-foreground">
                  {(selected.profile as Profile)?.nome} {(selected.profile as Profile)?.cognome}
                </span>
              </p>
            )}
            <div className="space-y-2">
              <Label>{action === 'reject' ? 'Motivazione del rigetto *' : 'Note (opzionale)'}</Label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={action === 'reject' ? 'Inserisci la motivazione del rigetto...' : 'Aggiungi una nota interna (opzionale)...'}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAction(null); setNote(''); }}>Annulla</Button>
            <Button
              onClick={handleAction}
              disabled={(action === 'reject' && !note.trim()) || submitting}
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {action === 'approve' ? 'Conferma Approvazione' : 'Conferma Rigetto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
