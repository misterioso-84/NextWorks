'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { generateId } from '@/lib/utils';
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from '@/lib/constants';
import type { WorkExperience } from '@/lib/types';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Props {
  value: WorkExperience[];
  onChange: (v: WorkExperience[]) => void;
}

export function WorkExperienceSection({ value, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<WorkExperience>>({});

  const resetForm = () => {
    setForm({});
    setAdding(false);
    setEditingId(null);
  };

  const startAdd = () => {
    setForm({ attuale: false });
    setAdding(true);
    setEditingId(null);
  };

  const startEdit = (exp: WorkExperience) => {
    setForm({ ...exp });
    setEditingId(exp.id);
    setAdding(false);
  };

  const saveItem = () => {
    if (!form.azienda || !form.ruolo || !form.data_inizio) return;
    const item: WorkExperience = {
      id: editingId || generateId(),
      azienda: form.azienda,
      ruolo: form.ruolo,
      data_inizio: form.data_inizio,
      data_fine: form.attuale ? null : form.data_fine || null,
      attuale: !!form.attuale,
      descrizione: form.descrizione || '',
    };
    if (editingId) {
      onChange(value.map(e => e.id === editingId ? item : e));
    } else {
      onChange([...value, item]);
    }
    resetForm();
  };

  const remove = (id: string) => onChange(value.filter(e => e.id !== id));

  const FormPanel = () => (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Azienda *</Label>
            <Input value={form.azienda || ''} onChange={e => setForm(f => ({ ...f, azienda: e.target.value }))} placeholder="Nome azienda" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ruolo *</Label>
            <Input value={form.ruolo || ''} onChange={e => setForm(f => ({ ...f, ruolo: e.target.value }))} placeholder="Titolo posizione" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Inizio *</Label>
            <Input type="date" value={form.data_inizio || ''} onChange={e => setForm(f => ({ ...f, data_inizio: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Fine</Label>
            <Input type="date" value={form.data_fine || ''} onChange={e => setForm(f => ({ ...f, data_fine: e.target.value }))} disabled={!!form.attuale} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="attuale" checked={!!form.attuale} onCheckedChange={c => setForm(f => ({ ...f, attuale: !!c }))} />
          <Label htmlFor="attuale" className="text-sm cursor-pointer">Posizione attuale</Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Descrizione</Label>
          <textarea
            value={form.descrizione || ''}
            onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
            placeholder="Descrivi le tue responsabilità e risultati..."
            className="w-full min-h-[80px] p-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={resetForm}>Annulla</Button>
          <Button size="sm" onClick={saveItem} disabled={!form.azienda || !form.ruolo || !form.data_inizio}>
            {editingId ? 'Aggiorna' : 'Aggiungi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Esperienze Lavorative</CardTitle>
          {!adding && !editingId && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={startAdd}>
              <Plus className="h-3.5 w-3.5" />Aggiungi
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(adding) && <FormPanel />}
        {value.length === 0 && !adding ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nessuna esperienza lavorativa aggiunta</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={startAdd}>
              <Plus className="h-3.5 w-3.5" />Aggiungi la prima esperienza
            </Button>
          </div>
        ) : (
          value.map(exp => (
            <div key={exp.id}>
              {editingId === exp.id ? (
                <FormPanel />
              ) : (
                <div className="border rounded-lg p-3.5 space-y-1.5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{exp.ruolo}</p>
                      <p className="text-sm text-muted-foreground">{exp.azienda}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(exp.data_inizio)} — {exp.attuale ? 'Presente' : exp.data_fine ? formatDate(exp.data_fine) : 'N/D'}
                        {exp.attuale && <Badge className="ml-2 h-4 text-[10px] px-1.5">Attuale</Badge>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(exp)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {exp.descrizione && <p className="text-xs text-muted-foreground line-clamp-2">{exp.descrizione}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
