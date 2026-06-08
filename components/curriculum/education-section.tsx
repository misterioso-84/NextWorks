'use client';

import { useState } from 'react';
import { generateId, formatDate } from '@/lib/utils';
import type { Education } from '@/lib/types';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props { value: Education[]; onChange: (v: Education[]) => void; }

export function EducationSection({ value, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Education>>({});

  const resetForm = () => { setForm({}); setAdding(false); setEditingId(null); };

  const startAdd = () => { setForm({}); setAdding(true); setEditingId(null); };
  const startEdit = (e: Education) => { setForm({ ...e }); setEditingId(e.id); setAdding(false); };

  const saveItem = () => {
    if (!form.istituto || !form.titolo || !form.data_inizio) return;
    const item: Education = {
      id: editingId || generateId(),
      istituto: form.istituto,
      titolo: form.titolo,
      data_inizio: form.data_inizio,
      data_fine: form.data_fine || null,
      voto: form.voto || '',
      descrizione: form.descrizione || '',
    };
    if (editingId) {
      onChange(value.map(e => e.id === editingId ? item : e));
    } else {
      onChange([...value, item]);
    }
    resetForm();
  };

  const FormPanel = () => (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Istituto / Università *</Label>
            <Input value={form.istituto || ''} onChange={e => setForm(f => ({ ...f, istituto: e.target.value }))} placeholder="Nome istituto" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Titolo / Qualifica *</Label>
            <Input value={form.titolo || ''} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} placeholder="es. Laurea in Informatica" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Inizio *</Label>
            <Input type="date" value={form.data_inizio || ''} onChange={e => setForm(f => ({ ...f, data_inizio: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Fine</Label>
            <Input type="date" value={form.data_fine || ''} onChange={e => setForm(f => ({ ...f, data_fine: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Voto / Valutazione</Label>
            <Input value={form.voto || ''} onChange={e => setForm(f => ({ ...f, voto: e.target.value }))} placeholder="es. 110/110, 85/100" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Descrizione</Label>
          <textarea value={form.descrizione || ''} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} placeholder="Materie principali, tesi, attività..." className="w-full min-h-[80px] p-2.5 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={resetForm}>Annulla</Button>
          <Button size="sm" onClick={saveItem} disabled={!form.istituto || !form.titolo || !form.data_inizio}>{editingId ? 'Aggiorna' : 'Aggiungi'}</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Formazione</CardTitle>
          {!adding && !editingId && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={startAdd}><Plus className="h-3.5 w-3.5" />Aggiungi</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && <FormPanel />}
        {value.length === 0 && !adding ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nessuna formazione aggiunta</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={startAdd}><Plus className="h-3.5 w-3.5" />Aggiungi</Button>
          </div>
        ) : (
          value.map(ed => (
            <div key={ed.id}>
              {editingId === ed.id ? <FormPanel /> : (
                <div className="border rounded-lg p-3.5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{ed.titolo}</p>
                      <p className="text-sm text-muted-foreground">{ed.istituto}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(ed.data_inizio)} — {ed.data_fine ? formatDate(ed.data_fine) : 'In corso'}
                        {ed.voto && <span className="ml-2 font-medium">{ed.voto}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(ed)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onChange(value.filter(e => e.id !== ed.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
