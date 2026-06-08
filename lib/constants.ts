import type { UserRole, ApplicationStatus, CompanyStatus } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  CITTADINO: 'Cittadino',
  DIPENDENTE: 'Dipendente',
  DIREZIONE: 'Direzione Aziendale',
  AMMINISTRATORE: 'Amministratore',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  CITTADINO: 'bg-slate-100 text-slate-700',
  DIPENDENTE: 'bg-blue-100 text-blue-700',
  DIREZIONE: 'bg-amber-100 text-amber-700',
  AMMINISTRATORE: 'bg-red-100 text-red-700',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  IN_VERIFICA: 'In Verifica',
  VERIFICATA: 'Verificata',
  IN_VALUTAZIONE: 'In Valutazione',
  ACCETTATA: 'Accettata',
  RESPINTA: 'Respinta',
  ARCHIVIATA: 'Archiviata',
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  IN_VERIFICA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  VERIFICATA: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_VALUTAZIONE: 'bg-orange-100 text-orange-700 border-orange-200',
  ACCETTATA: 'bg-green-100 text-green-700 border-green-200',
  RESPINTA: 'bg-red-100 text-red-700 border-red-200',
  ARCHIVIATA: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  ATTIVA: 'Attiva',
  INATTIVA: 'Inattiva',
  IN_SOSPESO: 'In Sospeso',
};

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  ATTIVA: 'bg-green-100 text-green-700 border-green-200',
  INATTIVA: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_SOSPESO: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  CITTADINO: '/cittadino',
  DIPENDENTE: '/dipendente',
  DIREZIONE: '/direzione',
  AMMINISTRATORE: '/amministratore',
};

export const SKILL_LEVELS = ['BASE', 'INTERMEDIO', 'AVANZATO', 'ESPERTO'] as const;
export const SKILL_LEVEL_LABELS: Record<string, string> = {
  BASE: 'Base',
  INTERMEDIO: 'Intermedio',
  AVANZATO: 'Avanzato',
  ESPERTO: 'Esperto',
};

export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'MADRELINGUA'] as const;
export const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  A1: 'A1 - Principiante',
  A2: 'A2 - Elementare',
  B1: 'B1 - Pre-Intermedio',
  B2: 'B2 - Intermedio',
  C1: 'C1 - Avanzato',
  C2: 'C2 - Padronanza',
  MADRELINGUA: 'Madrelingua',
};

export const SETTORI_AZIENDALI = [
  'Tecnologia e Software',
  'Finanza e Bancario',
  'Sanità e Farmaceutico',
  'Commercio e Retail',
  'Manifatturiero e Industria',
  'Edilizia e Costruzioni',
  'Istruzione e Formazione',
  'Servizi Professionali',
  'Logistica e Trasporti',
  'Turismo e Hospitality',
  'Agricoltura',
  'Energia e Utilities',
  'Media e Comunicazione',
  'Pubblica Amministrazione',
  'Altro',
];

export const PATENTI_DISPONIBILI = ['AM', 'A1', 'A2', 'A', 'B1', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE'];

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'IN_VERIFICA',
  'VERIFICATA',
  'IN_VALUTAZIONE',
];
