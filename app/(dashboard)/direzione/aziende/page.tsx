'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { Company } from '@/lib/types';
import { COMPANY_STATUS_COLORS, COMPANY_STATUS_LABELS } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { Building, MapPin, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DirezioneAziendePage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from('company_directors')
        .select('company:companies(*)')
        .eq('user_id', profile.id);
      const c = ((data?.map(d => d.company).filter(Boolean)) as unknown as Company[]) || [];
      setCompanies(c);
      setLoading(false);
    };
    load();
  }, [profile]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Le Mie Aziende</h1>
        <p className="text-muted-foreground mt-1">Aziende di cui sei membro della direzione</p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nessuna azienda assegnata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.nome}</p>
                    <span className={cn('inline-flex text-xs px-2 py-0.5 rounded-full border mt-1', COMPANY_STATUS_COLORS[c.stato])}>
                      {COMPANY_STATUS_LABELS[c.stato]}
                    </span>
                  </div>
                </div>
                {c.descrizione && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{c.descrizione}</p>}
                <div className="mt-3 space-y-1.5">
                  {c.settore && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Briefcase className="h-3.5 w-3.5" />{c.settore}</div>}
                  {c.localita && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.localita}</div>}
                  {c.data_adesione && <div className="text-xs text-muted-foreground">Membro dal {formatDate(c.data_adesione)}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
