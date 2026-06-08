'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ROLE_DASHBOARD_PATHS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se ha finito di caricare
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (profile?.role && ROLE_DASHBOARD_PATHS[profile.role]) {
        router.replace(ROLE_DASHBOARD_PATHS[profile.role]);
      } else if (user) {
        // Fallback: se sei loggato ma non hai un ruolo/dashboard definita,
        // evita il blocco e mandati da qualche parte (es. una dashboard generica o home)
        console.warn("Profilo non trovato o ruolo non valido, invio alla home di default");
        router.replace('/dashboard'); // <--- CAMBIA CON UN PATH ESISTENTE
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Aggiungi questo per debuggare */}
        {loading && (
            <div className="text-xs text-gray-400">Verifica sessione in corso...</div>
        )}
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xl">SL</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Caricamento...</p>
      </div>
    </div>
  );
}