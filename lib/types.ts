export type UserRole = 'CITTADINO' | 'DIPENDENTE' | 'DIREZIONE' | 'AMMINISTRATORE';
export type CompanyStatus = 'ATTIVA' | 'INATTIVA' | 'IN_SOSPESO';
export type ApplicationStatus =
  | 'IN_VERIFICA'
  | 'VERIFICATA'
  | 'IN_VALUTAZIONE'
  | 'ACCETTATA'
  | 'RESPINTA'
  | 'ARCHIVIATA';
export type NotificationType =
  | 'CANDIDATURA_INVIATA'
  | 'RICHIESTA_VERIFICATA'
  | 'RICHIESTA_RESPINTA'
  | 'RICHIESTA_APPROVATA'
  | 'NUOVO_MESSAGGIO'
  | 'CAMBIO_STATO'
  | 'AGGIORNAMENTO_ADMIN';

export interface Profile {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  telefono: string | null;
  telegram: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  nome: string;
  logo_url: string | null;
  descrizione: string | null;
  settore: string | null;
  localita: string | null;
  data_adesione: string | null;
  stato: CompanyStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyDirector {
  id: string;
  user_id: string;
  company_id: string;
  assigned_by: string | null;
  created_at: string;
  profile?: Profile;
  company?: Company;
}

export interface Employee {
  id: string;
  user_id: string;
  assigned_by: string | null;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface WorkExperience {
  id: string;
  azienda: string;
  ruolo: string;
  data_inizio: string;
  data_fine: string | null;
  attuale: boolean;
  descrizione: string;
}

export interface Education {
  id: string;
  istituto: string;
  titolo: string;
  data_inizio: string;
  data_fine: string | null;
  voto: string;
  descrizione: string;
}

export interface Certification {
  id: string;
  nome: string;
  ente: string;
  data_conseguimento: string;
  scadenza: string | null;
  credenziale_id: string;
}

export interface Skill {
  id: string;
  nome: string;
  livello: 'BASE' | 'INTERMEDIO' | 'AVANZATO' | 'ESPERTO';
}

export interface Language {
  id: string;
  lingua: string;
  livello: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'MADRELINGUA';
}

export interface Disponibilita {
  full_time: boolean;
  part_time: boolean;
  remoto: boolean;
  trasferte: boolean;
  turni: boolean;
  note: string;
}

export interface CurriculumData {
  informazioni_personali: {
    indirizzo?: string;
    citta?: string;
    cap?: string;
    data_nascita?: string;
    luogo_nascita?: string;
    nazionalita?: string;
    linkedin?: string;
    sito_web?: string;
  };
  presentazione: string;
  esperienze_lavorative: WorkExperience[];
  formazione: Education[];
  certificazioni: Certification[];
  competenze: Skill[];
  lingue: Language[];
  patenti: string[];
  disponibilita: Disponibilita;
  informazioni_aggiuntive: string;
}

export interface Curriculum {
  id: string;
  user_id: string;
  informazioni_personali: CurriculumData['informazioni_personali'];
  presentazione: string;
  esperienze_lavorative: WorkExperience[];
  formazione: Education[];
  certificazioni: Certification[];
  competenze: Skill[];
  lingue: Language[];
  patenti: string[];
  disponibilita: Disponibilita;
  informazioni_aggiuntive: string;
  is_bozza: boolean;
  ultimo_aggiornamento: string;
  created_at: string;
  profile?: Profile;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_id: string;
  curriculum_snapshot: CurriculumData | null;
  stato: ApplicationStatus;
  motivazione_rigetto: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  company?: Company;
  verified_by_profile?: Profile;
  notes?: ApplicationNote[];
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  user_id: string;
  contenuto: string;
  created_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  titolo: string;
  descrizione: string;
  tipo: NotificationType;
  letto: boolean;
  application_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  application_id: string | null;
  oggetto: string;
  contenuto: string;
  letto: boolean;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
  application?: JobApplication;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  azione: string;
  entita: string | null;
  entita_id: string | null;
  dettagli: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      companies: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> };
      company_directors: { Row: CompanyDirector; Insert: Partial<CompanyDirector>; Update: Partial<CompanyDirector> };
      employees: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> };
      curricula: { Row: Curriculum; Insert: Partial<Curriculum>; Update: Partial<Curriculum> };
      job_applications: { Row: JobApplication; Insert: Partial<JobApplication>; Update: Partial<JobApplication> };
      application_notes: { Row: ApplicationNote; Insert: Partial<ApplicationNote>; Update: Partial<ApplicationNote> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
}
