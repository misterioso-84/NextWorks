'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit';
import type { Curriculum } from '@/lib/types';
import { Loader2, Save, Eye, FileText, User, Briefcase, GraduationCap, Award, Wrench, Globe, Car, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonalInfoSection } from '@/components/curriculum/personal-info-section';
import { WorkExperienceSection } from '@/components/curriculum/work-experience-section';
import { EducationSection } from '@/components/curriculum/education-section';
import { SkillsSection } from '@/components/curriculum/skills-section';
import { LanguagesSection } from '@/components/curriculum/languages-section';
import { CertificationsSection } from '@/components/curriculum/certifications-section';
import { DisponibilitaSection } from '@/components/curriculum/disponibilita-section';
import { CurriculumPreview } from '@/components/curriculum/curriculum-preview';
import { formatDateTime } from '@/lib/utils';
import type { CurriculumData } from '@/lib/types';

const defaultCurriculum: CurriculumData = {
  informazioni_personali: {},
  presentazione: '',
  esperienze_lavorative: [],
  formazione: [],
  certificazioni: [],
  competenze: [],
  lingue: [],
  patenti: [],
  disponibilita: { full_time: false, part_time: false, remoto: false, trasferte: false, turni: false, note: '' },
  informazioni_aggiuntive: '',
};

export default function CurriculumPage() {
  const { profile } = useAuth();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [data, setData] = useState<CurriculumData>(defaultCurriculum);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadCurriculum();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadCurriculum = async () => {
    if (!profile) return;
    const { data: cv } = await supabase
      .from('curricula')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (cv) {
      setCurriculum(cv as Curriculum);
      setData({
        informazioni_personali: cv.informazioni_personali || {},
        presentazione: cv.presentazione || '',
        esperienze_lavorative: cv.esperienze_lavorative || [],
        formazione: cv.formazione || [],
        certificazioni: cv.certificazioni || [],
        competenze: cv.competenze || [],
        lingue: cv.lingue || [],
        patenti: cv.patenti || [],
        disponibilita: cv.disponibilita || defaultCurriculum.disponibilita,
        informazioni_aggiuntive: cv.informazioni_aggiuntive || '',
      });
      setIsDraft(cv.is_bozza);
    }
    setLoading(false);
  };

  const save = async (draft: boolean) => {
    if (!profile) return;
    setSaving(true);
    const payload = {
      user_id: profile.id,
      informazioni_personali: data.informazioni_personali,
      presentazione: data.presentazione,
      esperienze_lavorative: data.esperienze_lavorative,
      formazione: data.formazione,
      certificazioni: data.certificazioni,
      competenze: data.competenze,
      lingue: data.lingue,
      patenti: data.patenti,
      disponibilita: data.disponibilita,
      informazioni_aggiuntive: data.informazioni_aggiuntive,
      is_bozza: draft,
      ultimo_aggiornamento: new Date().toISOString(),
    };

    let error;
    if (curriculum) {
      ({ error } = await supabase.from('curricula').update(payload).eq('id', curriculum.id));
    } else {
      ({ error } = await supabase.from('curricula').insert(payload));
    }

    if (error) {
      toast.error('Errore nel salvataggio del curriculum');
    } else {
      setIsDraft(draft);
      await logAudit({ azione: draft ? 'SALVA_BOZZA_CURRICULUM' : 'PUBBLICA_CURRICULUM', entita: 'curricula' });
      toast.success(draft ? 'Bozza salvata con successo' : 'Curriculum pubblicato con successo');
      await loadCurriculum();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Anteprima Curriculum</h1>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Torna all&apos;editor
          </Button>
        </div>
        <CurriculumPreview data={data} profile={profile!} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Il Mio Curriculum</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">Editor professionale del curriculum</p>
            {curriculum && (
              <Badge variant={isDraft ? 'secondary' : 'default'}>
                {isDraft ? 'Bozza' : 'Pubblicato'}
              </Badge>
            )}
          </div>
          {curriculum && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Ultimo aggiornamento: {formatDateTime(curriculum.ultimo_aggiornamento)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            Anteprima
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => save(true)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva Bozza
          </Button>
          <Button className="gap-2" onClick={() => save(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Pubblica
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personali" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="personali" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" />Personali</TabsTrigger>
          <TabsTrigger value="presentazione" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Presentazione</TabsTrigger>
          <TabsTrigger value="esperienze" className="gap-1.5 text-xs"><Briefcase className="h-3.5 w-3.5" />Esperienze</TabsTrigger>
          <TabsTrigger value="formazione" className="gap-1.5 text-xs"><GraduationCap className="h-3.5 w-3.5" />Formazione</TabsTrigger>
          <TabsTrigger value="certificazioni" className="gap-1.5 text-xs"><Award className="h-3.5 w-3.5" />Certificazioni</TabsTrigger>
          <TabsTrigger value="competenze" className="gap-1.5 text-xs"><Wrench className="h-3.5 w-3.5" />Competenze</TabsTrigger>
          <TabsTrigger value="lingue" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" />Lingue</TabsTrigger>
          <TabsTrigger value="disponibilita" className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" />Disponibilità</TabsTrigger>
          <TabsTrigger value="altro" className="gap-1.5 text-xs"><Info className="h-3.5 w-3.5" />Altro</TabsTrigger>
        </TabsList>

        <TabsContent value="personali">
          <PersonalInfoSection
            value={data.informazioni_personali}
            onChange={(v) => setData(d => ({ ...d, informazioni_personali: v }))}
          />
        </TabsContent>

        <TabsContent value="presentazione">
          <Card>
            <CardHeader><CardTitle className="text-base">Presentazione Personale</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={data.presentazione}
                onChange={e => setData(d => ({ ...d, presentazione: e.target.value }))}
                placeholder="Scrivi una breve presentazione di te stesso, le tue aspirazioni e i tuoi punti di forza..."
                className="w-full min-h-[200px] p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esperienze">
          <WorkExperienceSection
            value={data.esperienze_lavorative}
            onChange={(v) => setData(d => ({ ...d, esperienze_lavorative: v }))}
          />
        </TabsContent>

        <TabsContent value="formazione">
          <EducationSection
            value={data.formazione}
            onChange={(v) => setData(d => ({ ...d, formazione: v }))}
          />
        </TabsContent>

        <TabsContent value="certificazioni">
          <CertificationsSection
            value={data.certificazioni}
            onChange={(v) => setData(d => ({ ...d, certificazioni: v }))}
          />
        </TabsContent>

        <TabsContent value="competenze">
          <SkillsSection
            value={data.competenze}
            onChange={(v) => setData(d => ({ ...d, competenze: v }))}
          />
        </TabsContent>

        <TabsContent value="lingue">
          <LanguagesSection
            value={data.lingue}
            onChange={(v) => setData(d => ({ ...d, lingue: v }))}
          />
        </TabsContent>

        <TabsContent value="disponibilita">
          <DisponibilitaSection
            value={data.disponibilita}
            patenti={data.patenti}
            onChange={(v) => setData(d => ({ ...d, disponibilita: v }))}
            onPatentiChange={(v) => setData(d => ({ ...d, patenti: v }))}
          />
        </TabsContent>

        <TabsContent value="altro">
          <Card>
            <CardHeader><CardTitle className="text-base">Informazioni Aggiuntive</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={data.informazioni_aggiuntive}
                onChange={e => setData(d => ({ ...d, informazioni_aggiuntive: e.target.value }))}
                placeholder="Hobby, interessi, informazioni aggiuntive rilevanti..."
                className="w-full min-h-[200px] p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
