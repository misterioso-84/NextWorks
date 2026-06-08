'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { Loader2, Save, User, Phone, Mail, IdCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

const profileSchema = z.object({
  nome: z.string().min(2, 'Almeno 2 caratteri'),
  cognome: z.string().min(2, 'Almeno 2 caratteri'),
  telefono: z.string().optional(),
  telegram: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfiloPage() {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: profile?.nome || '',
      cognome: profile?.cognome || '',
      telefono: profile?.telefono || '',
      telegram: profile?.telegram || '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        nome: profile.nome,
        cognome: profile.cognome,
        telefono: profile.telefono || '',
        telegram: profile.telegram || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      nome: data.nome,
      cognome: data.cognome,
      telefono: data.telefono || null,
      telegram: data.telegram || null,
    }).eq('id', profile.id);

    if (error) {
      toast.error('Errore nel salvataggio del profilo');
    } else {
      await logAudit({ azione: 'MODIFICA_PROFILO', entita: 'profiles', entita_id: profile.id });
      await refreshProfile();
      toast.success('Profilo aggiornato con successo');
      reset(data);
    }
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Il Mio Profilo</h1>
        <p className="text-muted-foreground mt-1">Gestisci le informazioni del tuo account</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informazioni Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              {profile.nome[0]}{profile.cognome[0]}
            </div>
            <div>
              <p className="text-lg font-semibold">{profile.nome} {profile.cognome}</p>
              <Badge className="mt-1">{ROLE_LABELS[profile.role]}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" />Codice Fiscale</p>
              <p className="font-mono font-medium mt-0.5">{profile.codice_fiscale}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</p>
              <p className="font-medium mt-0.5">{profile.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Membro dal</p>
              <p className="font-medium mt-0.5">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stato Account</p>
              <Badge variant={profile.is_active ? 'default' : 'destructive'} className="mt-0.5">
                {profile.is_active ? 'Attivo' : 'Disattivato'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifica Informazioni</CardTitle>
          <CardDescription>Aggiorna i tuoi dati di contatto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input {...register('nome')} className={errors.nome ? 'border-destructive' : ''} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cognome</Label>
                <Input {...register('cognome')} className={errors.cognome ? 'border-destructive' : ''} />
                {errors.cognome && <p className="text-xs text-destructive">{errors.cognome.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input {...register('telefono')} placeholder="+39 333 1234567" type="tel" />
              </div>
              <div className="space-y-2">
                <Label>Username Telegram</Label>
                <Input {...register('telegram')} placeholder="@username" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!isDirty || saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salva Modifiche
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
