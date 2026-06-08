'use client';

import { useState } from 'react';
import { generateId, formatDate } from '@/lib/utils';
import type { Certification } from '@/lib/types';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props { value: Certification[]; onChange: (v: Certification[]) => void; }

export function CertificationsSection({ value, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Certification>>({});

  const resetForm = () => { setForm({}); setAdding(false); setEditingId(null); };
  const startAdd = () => { setForm({}); setAdding(true); setEditingId(null); };
  const startEdit = (c: Certification) => { setForm({ ...c }); setEditingId(c.id); setAdding(false); };

  const saveItem = () => {
    if (!form.nome || !form.ente || !form.data_conseguimento) return;
    const item: Certification = {
      id: editingId || generateId(),
      nome: form.nome,
      ente: form.ente,
      data_conseguimento: form.data_conseguimento,
      scadenza: form.scadenza || null,
      credenziale_id: form.credenziale_id || '',
    };
    if (editingId) onChange(value.map(c => c.id === editingId ? item : c));
    else onChange([...value, item]);
    resetForm();
  };

  const FormPanel = () => (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome Certificazione *</Label><Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="es. AWS Solutions Architect" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Ente Emittente *</Label><Input value={form.ente || ''} onChange={e => setForm(f => ({ ...f, ente: e.target.value }))} placeholder="es. Amazon Web Services" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Data Conseguimento *</Label><Input type="date" value={form.data_conseguimento || ''} onChange={e => setForm(f => ({ ...f, data_conseguimento: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Scadenza</Label><Input type="date" value={form.scadenza || ''} onChange={e => setForm(f => ({ ...f, scadenza: e.target.value }))} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">ID Credenziale</Label><Input value={form.credenziale_id || ''} onChange={e => setForm(f => ({ ...f, credenziale_id: e.target.value }))} placeholder="Numero o codice credenziale" /></div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={resetForm}>Annulla</Button>
          <Button size="sm" onClick={saveItem} disabled={!form.nome || !form.ente || !form.data_conseguimento}>{editingId ? 'Aggiorna' : 'Aggiungi'}</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Certificazioni</CardTitle>
          {!adding && !editingId && <Button size="sm" variant="outline" className="gap-1.5" onClick={startAdd}><Plus className="h-3.5 w-3.5" />Aggiungi</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && <FormPanel />}
        {value.length === 0 && !adding ? (
          <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Nessuna certificazione aggiunta</p><Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={startAdd}><Plus className="h-3.5 w-3.5" />Aggiungi</Button></div>
        ) : (
          value.map(cert => (
            <div key={cert.id}>{editingId === cert.id ? <FormPanel /> : (
              <div className="border rounded-lg p-3.5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{cert.nome}</p>
                    <p className="text-sm text-muted-foreground">{cert.ente}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conseguita il {formatDate(cert.data_conseguimento)}
                      {cert.scadenza && ` · Scade il ${formatDate(cert.scadenza)}`}
                      {cert.credenziale_id && ` · ID: ${cert.credenziale_id}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(cert)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onChange(value.filter(c => c.id !== cert.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            )}</div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
