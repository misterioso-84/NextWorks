'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CurriculumData } from '@/lib/types';

type PersonalInfo = CurriculumData['informazioni_personali'];

interface Props {
  value: PersonalInfo;
  onChange: (v: PersonalInfo) => void;
}

export function PersonalInfoSection({ value, onChange }: Props) {
  const set = (key: keyof PersonalInfo, val: string) => onChange({ ...value, [key]: val });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Informazioni Personali</CardTitle></CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data di Nascita</Label>
          <Input type="date" value={value.data_nascita || ''} onChange={e => set('data_nascita', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Luogo di Nascita</Label>
          <Input placeholder="Roma" value={value.luogo_nascita || ''} onChange={e => set('luogo_nascita', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Nazionalità</Label>
          <Input placeholder="Italiana" value={value.nazionalita || ''} onChange={e => set('nazionalita', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Indirizzo</Label>
          <Input placeholder="Via Roma 1" value={value.indirizzo || ''} onChange={e => set('indirizzo', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Città</Label>
          <Input placeholder="Roma" value={value.citta || ''} onChange={e => set('citta', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CAP</Label>
          <Input placeholder="00100" value={value.cap || ''} onChange={e => set('cap', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input placeholder="linkedin.com/in/username" value={value.linkedin || ''} onChange={e => set('linkedin', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sito Web</Label>
          <Input placeholder="www.miosito.it" value={value.sito_web || ''} onChange={e => set('sito_web', e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}
