'use client';

import { useState } from 'react';
import { generateId } from '@/lib/utils';
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, LANGUAGE_LEVELS, LANGUAGE_LEVEL_LABELS } from '@/lib/constants';
import type { Skill, Language, Certification } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

// Skills Section
interface SkillsProps { value: Skill[]; onChange: (v: Skill[]) => void; }

export function SkillsSection({ value, onChange }: SkillsProps) {
  const [form, setForm] = useState({ nome: '', livello: 'BASE' as Skill['livello'] });

  const add = () => {
    if (!form.nome.trim()) return;
    onChange([...value, { id: generateId(), nome: form.nome.trim(), livello: form.livello }]);
    setForm({ nome: '', livello: 'BASE' });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Competenze</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input className="flex-1" placeholder="Aggiungi competenza..." value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} onKeyDown={e => e.key === 'Enter' && add()} />
          <Select value={form.livello} onValueChange={(v) => setForm(f => ({ ...f, livello: v as Skill['livello'] }))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map(l => <SelectItem key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={!form.nome.trim()} className="gap-1.5"><Plus className="h-4 w-4" />Aggiungi</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.map(skill => (
            <div key={skill.id} className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full text-sm">
              <span>{skill.nome}</span>
              <Badge className="h-4 text-[10px] px-1 py-0">{SKILL_LEVEL_LABELS[skill.livello]}</Badge>
              <button onClick={() => onChange(value.filter(s => s.id !== skill.id))} className="text-muted-foreground hover:text-destructive ml-0.5">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {value.length === 0 && <p className="text-sm text-muted-foreground">Nessuna competenza aggiunta</p>}
        </div>
      </CardContent>
    </Card>
  );
}
