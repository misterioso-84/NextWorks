'use client';

import { PATENTI_DISPONIBILI } from '@/lib/constants';
import type { Disponibilita } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
  value: Disponibilita;
  patenti: string[];
  onChange: (v: Disponibilita) => void;
  onPatentiChange: (v: string[]) => void;
}

export function DisponibilitaSection({ value, patenti, onChange, onPatentiChange }: Props) {
  const togglePatente = (p: string) => {
    if (patenti.includes(p)) onPatentiChange(patenti.filter(x => x !== p));
    else onPatentiChange([...patenti, p]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Disponibilità Lavorativa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'full_time', label: 'Full Time' },
              { key: 'part_time', label: 'Part Time' },
              { key: 'remoto', label: 'Lavoro Remoto / Smart Working' },
              { key: 'trasferte', label: 'Disponibile a Trasferte' },
              { key: 'turni', label: 'Disponibile a Lavoro su Turni' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2.5">
                <Checkbox
                  id={item.key}
                  checked={value[item.key as keyof Disponibilita] as boolean}
                  onCheckedChange={c => onChange({ ...value, [item.key]: !!c })}
                />
                <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Note sulla disponibilità</Label>
            <textarea
              value={value.note || ''}
              onChange={e => onChange({ ...value, note: e.target.value })}
              placeholder="Eventuali note aggiuntive sulla disponibilità..."
              className="w-full min-h-[80px] p-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Patenti di Guida</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PATENTI_DISPONIBILI.map(p => (
              <button
                key={p}
                onClick={() => togglePatente(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  patenti.includes(p)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
