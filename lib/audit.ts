import { supabase } from '@/lib/supabase/client';
import type { AuditLog } from '@/lib/types';

export async function logAudit(params: {
  azione: string;
  entita?: string;
  entita_id?: string;
  dettagli?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    user_id: user?.id ?? null,
    azione: params.azione,
    entita: params.entita ?? null,
    entita_id: params.entita_id ?? null,
    dettagli: params.dettagli ?? {},
  });
}

export async function createNotification(params: {
  user_id: string;
  titolo: string;
  descrizione: string;
  tipo?: string;
  application_id?: string;
}) {
  await supabase.from('notifications').insert({
    user_id: params.user_id,
    titolo: params.titolo,
    descrizione: params.descrizione,
    tipo: (params.tipo as AuditLog['entita']) ?? 'AGGIORNAMENTO_ADMIN',
    application_id: params.application_id ?? null,
    letto: false,
  });
}
