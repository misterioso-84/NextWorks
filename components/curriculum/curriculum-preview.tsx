import type { CurriculumData, Profile } from '@/lib/types';
import { SKILL_LEVEL_LABELS, LANGUAGE_LEVEL_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: CurriculumData;
  profile: Profile;
}

export function CurriculumPreview({ data, profile }: Props) {
  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center pb-6 border-b-2 border-primary">
          <h1 className="text-3xl font-bold text-primary">{profile.nome} {profile.cognome}</h1>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{profile.email}</span>
            {profile.telefono && <span>· {profile.telefono}</span>}
            {profile.telegram && <span>· Telegram: {profile.telegram}</span>}
            {data.informazioni_personali.citta && <span>· {data.informazioni_personali.citta}</span>}
            {data.informazioni_personali.linkedin && <span>· <a href={`https://${data.informazioni_personali.linkedin}`} className="text-primary hover:underline">{data.informazioni_personali.linkedin}</a></span>}
          </div>
          {data.informazioni_personali.data_nascita && (
            <p className="text-xs text-muted-foreground mt-1">
              Nato il {formatDate(data.informazioni_personali.data_nascita)}
              {data.informazioni_personali.luogo_nascita && ` a ${data.informazioni_personali.luogo_nascita}`}
              {data.informazioni_personali.nazionalita && ` · ${data.informazioni_personali.nazionalita}`}
            </p>
          )}
        </div>

        {/* Presentazione */}
        {data.presentazione && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Presentazione</h2>
            <p className="text-sm leading-relaxed">{data.presentazione}</p>
          </section>
        )}

        {/* Esperienze */}
        {data.esperienze_lavorative.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Esperienze Lavorative</h2>
            <div className="space-y-3">
              {data.esperienze_lavorative.map(exp => (
                <div key={exp.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{exp.ruolo}</p>
                      <p className="text-sm text-muted-foreground">{exp.azienda}</p>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {formatDate(exp.data_inizio)} — {exp.attuale ? 'Presente' : exp.data_fine ? formatDate(exp.data_fine) : 'N/D'}
                    </p>
                  </div>
                  {exp.descrizione && <p className="text-sm mt-1 text-muted-foreground">{exp.descrizione}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formazione */}
        {data.formazione.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Formazione</h2>
            <div className="space-y-3">
              {data.formazione.map(ed => (
                <div key={ed.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{ed.titolo}</p>
                      <p className="text-sm text-muted-foreground">{ed.istituto}{ed.voto ? ` · ${ed.voto}` : ''}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ed.data_inizio)} — {ed.data_fine ? formatDate(ed.data_fine) : 'In corso'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competenze + Lingue */}
        <div className="grid sm:grid-cols-2 gap-6">
          {data.competenze.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Competenze</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.competenze.map(skill => (
                  <Badge key={skill.id} variant="secondary" className="text-xs">
                    {skill.nome} · {SKILL_LEVEL_LABELS[skill.livello]}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {data.lingue.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Lingue</h2>
              <div className="space-y-1">
                {data.lingue.map(lang => (
                  <div key={lang.id} className="flex items-center justify-between text-sm">
                    <span>{lang.lingua}</span>
                    <span className="text-muted-foreground">{LANGUAGE_LEVEL_LABELS[lang.livello]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Certificazioni */}
        {data.certificazioni.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Certificazioni</h2>
            <div className="space-y-2">
              {data.certificazioni.map(cert => (
                <div key={cert.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{cert.nome}</span>
                    <span className="text-muted-foreground ml-2">— {cert.ente}</span>
                  </div>
                  <span className="text-muted-foreground">{formatDate(cert.data_conseguimento)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disponibilità + Patenti */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Disponibilità</h2>
          <div className="flex flex-wrap gap-2">
            {data.disponibilita.full_time && <Badge variant="outline">Full Time</Badge>}
            {data.disponibilita.part_time && <Badge variant="outline">Part Time</Badge>}
            {data.disponibilita.remoto && <Badge variant="outline">Remoto</Badge>}
            {data.disponibilita.trasferte && <Badge variant="outline">Trasferte</Badge>}
            {data.disponibilita.turni && <Badge variant="outline">Turni</Badge>}
            {data.patenti.map(p => <Badge key={p} variant="outline">Patente {p}</Badge>)}
          </div>
          {data.disponibilita.note && <p className="text-sm text-muted-foreground mt-2">{data.disponibilita.note}</p>}
        </section>

        {/* Info aggiuntive */}
        {data.informazioni_aggiuntive && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Informazioni Aggiuntive</h2>
            <p className="text-sm leading-relaxed">{data.informazioni_aggiuntive}</p>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
