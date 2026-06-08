'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const codiceFiscaleRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;

const registerSchema = z.object({
  nome: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(50),
  cognome: z.string().min(2, 'Il cognome deve contenere almeno 2 caratteri').max(50),
  codice_fiscale: z.string().regex(codiceFiscaleRegex, 'Codice Fiscale non valido'),
  telefono: z.string().optional(),
  telegram: z.string().optional(),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
  conferma_password: z.string(),
}).refine(data => data.password === data.conferma_password, {
  message: 'Le password non coincidono',
  path: ['conferma_password'],
}).refine(data => data.telefono || data.telegram, {
  message: 'Inserisci almeno un contatto: telefono o username Telegram',
  path: ['telefono'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        toast.error('Email già registrata. Effettua il login.');
      } else {
        toast.error('Errore durante la registrazione: ' + authError.message);
      }
      return;
    }

    if (!authData.user) {
      toast.error('Errore durante la creazione dell\'account.');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      nome: data.nome,
      cognome: data.cognome,
      codice_fiscale: data.codice_fiscale.toUpperCase(),
      telefono: data.telefono || null,
      telegram: data.telegram || null,
      email: data.email,
      role: 'CITTADINO',
    });

    if (profileError) {
      if (profileError.message.includes('codice_fiscale')) {
        toast.error('Codice Fiscale già registrato nel sistema.');
      } else {
        toast.error('Errore durante il salvataggio del profilo: ' + profileError.message);
      }
      await supabase.auth.signOut();
      return;
    }

    toast.success('Registrazione completata con successo! Benvenuto.');
    router.push('/cittadino');
  };

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Registrazione</CardTitle>
        <CardDescription className="text-center">
          Crea il tuo account per accedere alla piattaforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 text-sm">
            <strong>Attenzione:</strong> Tutti i dati inseriti devono essere reali e corrispondenti alla tua identità (RP). La registrazione con dati falsi non è consentita.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Mario" {...register('nome')} className={errors.nome ? 'border-destructive' : ''} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cognome">Cognome *</Label>
              <Input id="cognome" placeholder="Rossi" {...register('cognome')} className={errors.cognome ? 'border-destructive' : ''} />
              {errors.cognome && <p className="text-xs text-destructive">{errors.cognome.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codice_fiscale">Codice Fiscale *</Label>
            <Input
              id="codice_fiscale"
              placeholder="RSSMRA80A01H501U"
              className={`uppercase ${errors.codice_fiscale ? 'border-destructive' : ''}`}
              {...register('codice_fiscale')}
            />
            {errors.codice_fiscale && <p className="text-xs text-destructive">{errors.codice_fiscale.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" placeholder="+39 333 1234567" type="tel" {...register('telefono')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Username Telegram</Label>
              <Input id="telegram" placeholder="@username" {...register('telegram')} />
            </div>
          </div>
          {errors.telefono && <p className="text-xs text-destructive -mt-2">{errors.telefono.message}</p>}

          <div className="space-y-2">
            <Label htmlFor="email">Indirizzo Email *</Label>
            <Input id="email" type="email" placeholder="mario.rossi@email.it" autoComplete="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 8 caratteri"
                autoComplete="new-password"
                {...register('password')}
                className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conferma_password">Conferma Password *</Label>
            <div className="relative">
              <Input
                id="conferma_password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ripeti la password"
                autoComplete="new-password"
                {...register('conferma_password')}
                className={`pr-10 ${errors.conferma_password ? 'border-destructive' : ''}`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.conferma_password && <p className="text-xs text-destructive">{errors.conferma_password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrazione in corso...</>
            ) : 'Crea Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="pt-0">
        <p className="text-sm text-muted-foreground text-center w-full">
          Hai già un account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Accedi</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
