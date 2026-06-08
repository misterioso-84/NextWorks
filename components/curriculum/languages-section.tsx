'use client';

import { useState } from 'react';
import { generateId } from '@/lib/utils';
import { LANGUAGE_LEVELS, LANGUAGE_LEVEL_LABELS } from '@/lib/constants';
import type { Language } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Props { value: Language[]; onChange: (v: Language[]) => void; }

export function LanguagesSection({ value, onChange }: Props) {
  const [form, setForm] = useState({ lingua: '', livello: 'B1' as Language['livello'] });

  const add = () => {
    if (!form.lingua.trim()) return;
    onChange([...value, { id: generateId(), lingua: form.lingua.trim(), livello: form.livello }]);
    setForm({ lingua: '', livello: 'B1' });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Lingue Conosciute</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input className="flex-1" placeholder="es. Inglese" value={form.lingua} onChange={e => setForm(f => ({ ...f, lingua: e.target.value }))} onKeyDown={e => e.key === 'Enter' && add()} />
          <Select value={form.livello} onValueChange={v => setForm(f => ({ ...f, livello: v as Language['livello'] }))}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map(l => <SelectItem key={l} value={l}>{LANGUAGE_LEVEL_LABELS[l]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={!form.lingua.trim()} className="gap-1.5"><Plus className="h-4 w-4" />Aggiungi</Button>
        </div>
        <div className="space-y-2">
          {value.map(lang => (
            <div key={lang.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <span className="font-medium text-sm">{lang.lingua}</span>
                <Badge variant="secondary" className="ml-2 text-xs">{LANGUAGE_LEVEL_LABELS[lang.livello]}</Badge>
              </div>
              <button onClick={() => onChange(value.filter(l => l.id !== lang.id))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {value.length === 0 && <p className="text-sm text-muted-foreground">Nessuna lingua aggiunta</p>}
        </div>
      </CardContent>
    </Card>
  );
}
