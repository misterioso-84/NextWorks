
/*
# Schema Completo - Sistema Gestione Lavoro Enterprise

## Descrizione
Schema completo per un sistema di gestione candidature di lavoro con RBAC avanzato.
Supporta 4 ruoli: Cittadino, Dipendente, Direzione Aziendale, Amministratore.

## Nuove Tabelle
1. `profiles` - Profili utenti (estende auth.users)
   - id, nome, cognome, codice_fiscale, telefono, telegram, email, ruolo, is_active
2. `companies` - Aziende
   - id, nome, logo_url, descrizione, settore, localita, data_adesione, stato
3. `company_directors` - Relazione many-to-many utenti-aziende per ruolo DIREZIONE
4. `employees` - Dipendenti assegnati dagli amministratori
5. `curricula` - Curriculum vitae in formato JSONB
6. `job_applications` - Richieste di lavoro con stati multipli
7. `notifications` - Sistema notifiche real-time
8. `messages` - Messaggistica interna unidirezionale
9. `audit_logs` - Log di sistema per operazioni importanti
10. `application_notes` - Note interne sulle candidature

## Sicurezza
- RLS abilitato su tutte le tabelle
- Policy per-ruolo tramite funzione helper `get_user_role()`
- Separazione netta dei permessi per ruolo
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITTADINO', 'DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE company_status AS ENUM ('ATTIVA', 'INATTIVA', 'IN_SOSPESO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'IN_VERIFICA', 'VERIFICATA', 'IN_VALUTAZIONE',
    'ACCETTATA', 'RESPINTA', 'ARCHIVIATA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'CANDIDATURA_INVIATA', 'RICHIESTA_VERIFICATA', 'RICHIESTA_RESPINTA',
    'RICHIESTA_APPROVATA', 'NUOVO_MESSAGGIO', 'CAMBIO_STATO', 'AGGIORNAMENTO_ADMIN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cognome text NOT NULL,
  codice_fiscale text UNIQUE NOT NULL,
  telefono text,
  telegram text,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'CITTADINO',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- COMPANIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  logo_url text,
  descrizione text,
  settore text,
  localita text,
  data_adesione date,
  stato company_status NOT NULL DEFAULT 'IN_SOSPESO',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMPANY DIRECTORS TABLE (many-to-many)
-- ============================================================

CREATE TABLE IF NOT EXISTS company_directors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE company_directors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EMPLOYEES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CURRICULA TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  informazioni_personali jsonb DEFAULT '{}',
  presentazione text DEFAULT '',
  esperienze_lavorative jsonb DEFAULT '[]',
  formazione jsonb DEFAULT '[]',
  certificazioni jsonb DEFAULT '[]',
  competenze jsonb DEFAULT '[]',
  lingue jsonb DEFAULT '[]',
  patenti jsonb DEFAULT '[]',
  disponibilita jsonb DEFAULT '{}',
  informazioni_aggiuntive text DEFAULT '',
  is_bozza boolean NOT NULL DEFAULT true,
  ultimo_aggiornamento timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- JOB APPLICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  curriculum_snapshot jsonb,
  stato application_status NOT NULL DEFAULT 'IN_VERIFICA',
  motivazione_rigetto text,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- APPLICATION NOTES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) DEFAULT auth.uid(),
  contenuto text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titolo text NOT NULL,
  descrizione text NOT NULL,
  tipo notification_type NOT NULL DEFAULT 'AGGIORNAMENTO_ADMIN',
  letto boolean NOT NULL DEFAULT false,
  application_id uuid REFERENCES job_applications(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id),
  to_user_id uuid NOT NULL REFERENCES profiles(id),
  application_id uuid REFERENCES job_applications(id),
  oggetto text NOT NULL,
  contenuto text NOT NULL,
  letto boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  azione text NOT NULL,
  entita text,
  entita_id uuid,
  dettagli jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_codice_fiscale ON profiles(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company_id ON job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_stato ON job_applications(stato);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_letto ON notifications(letto);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_company_directors_user_id ON company_directors(user_id);
CREATE INDEX IF NOT EXISTS idx_company_directors_company_id ON company_directors(company_id);

-- ============================================================
-- RLS POLICIES - PROFILES
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
TO authenticated USING (
  auth.uid() = id OR
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
TO authenticated USING (
  auth.uid() = id OR get_user_role() = 'AMMINISTRATORE'
) WITH CHECK (
  auth.uid() = id OR get_user_role() = 'AMMINISTRATORE'
);

-- ============================================================
-- RLS POLICIES - COMPANIES
-- ============================================================

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "companies_insert_admin" ON companies;
CREATE POLICY "companies_insert_admin" ON companies FOR INSERT
TO authenticated WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "companies_update_admin" ON companies;
CREATE POLICY "companies_update_admin" ON companies FOR UPDATE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE')
WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "companies_delete_admin" ON companies;
CREATE POLICY "companies_delete_admin" ON companies FOR DELETE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - COMPANY DIRECTORS
-- ============================================================

DROP POLICY IF EXISTS "company_directors_select" ON company_directors;
CREATE POLICY "company_directors_select" ON company_directors FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR
  get_user_role() IN ('DIPENDENTE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "company_directors_insert_admin" ON company_directors;
CREATE POLICY "company_directors_insert_admin" ON company_directors FOR INSERT
TO authenticated WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "company_directors_update_admin" ON company_directors;
CREATE POLICY "company_directors_update_admin" ON company_directors FOR UPDATE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE')
WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "company_directors_delete_admin" ON company_directors;
CREATE POLICY "company_directors_delete_admin" ON company_directors FOR DELETE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - EMPLOYEES
-- ============================================================

DROP POLICY IF EXISTS "employees_select" ON employees;
CREATE POLICY "employees_select" ON employees FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE'
);

DROP POLICY IF EXISTS "employees_insert_admin" ON employees;
CREATE POLICY "employees_insert_admin" ON employees FOR INSERT
TO authenticated WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "employees_update_admin" ON employees;
CREATE POLICY "employees_update_admin" ON employees FOR UPDATE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE')
WITH CHECK (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "employees_delete_admin" ON employees;
CREATE POLICY "employees_delete_admin" ON employees FOR DELETE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - CURRICULA
-- ============================================================

DROP POLICY IF EXISTS "curricula_select_own" ON curricula;
CREATE POLICY "curricula_select_own" ON curricula FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "curricula_insert_own" ON curricula;
CREATE POLICY "curricula_insert_own" ON curricula FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "curricula_update_own" ON curricula;
CREATE POLICY "curricula_update_own" ON curricula FOR UPDATE
TO authenticated USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "curricula_delete_own" ON curricula;
CREATE POLICY "curricula_delete_own" ON curricula FOR DELETE
TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES - JOB APPLICATIONS
-- ============================================================

DROP POLICY IF EXISTS "applications_select" ON job_applications;
CREATE POLICY "applications_select" ON job_applications FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR
  get_user_role() = 'DIPENDENTE' OR
  get_user_role() = 'AMMINISTRATORE' OR
  (
    get_user_role() = 'DIREZIONE' AND
    EXISTS (
      SELECT 1 FROM company_directors cd
      WHERE cd.company_id = job_applications.company_id
      AND cd.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "applications_insert_cittadino" ON job_applications;
CREATE POLICY "applications_insert_cittadino" ON job_applications FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = user_id AND
  get_user_role() = 'CITTADINO'
);

DROP POLICY IF EXISTS "applications_update" ON job_applications;
CREATE POLICY "applications_update" ON job_applications FOR UPDATE
TO authenticated USING (
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE') OR
  (get_user_role() = 'DIREZIONE' AND EXISTS (
    SELECT 1 FROM company_directors cd
    WHERE cd.company_id = job_applications.company_id
    AND cd.user_id = auth.uid()
  ))
) WITH CHECK (
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE') OR
  (get_user_role() = 'DIREZIONE' AND EXISTS (
    SELECT 1 FROM company_directors cd
    WHERE cd.company_id = job_applications.company_id
    AND cd.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "applications_delete_admin" ON job_applications;
CREATE POLICY "applications_delete_admin" ON job_applications FOR DELETE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - APPLICATION NOTES
-- ============================================================

DROP POLICY IF EXISTS "notes_select" ON application_notes;
CREATE POLICY "notes_select" ON application_notes FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "notes_insert" ON application_notes;
CREATE POLICY "notes_insert" ON application_notes FOR INSERT
TO authenticated WITH CHECK (
  get_user_role() IN ('DIPENDENTE', 'DIREZIONE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "notes_update_own" ON application_notes;
CREATE POLICY "notes_update_own" ON application_notes FOR UPDATE
TO authenticated USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notes_delete_own" ON application_notes;
CREATE POLICY "notes_delete_own" ON application_notes FOR DELETE
TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
TO authenticated USING (
  user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE'
);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
TO authenticated WITH CHECK (get_user_role() IN ('DIREZIONE', 'AMMINISTRATORE', 'DIPENDENTE') OR user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE')
WITH CHECK (user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "notifications_delete_admin" ON notifications;
CREATE POLICY "notifications_delete_admin" ON notifications FOR DELETE
TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - MESSAGES
-- ============================================================

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT
TO authenticated USING (
  to_user_id = auth.uid() OR
  from_user_id = auth.uid() OR
  get_user_role() = 'AMMINISTRATORE'
);

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT
TO authenticated WITH CHECK (
  from_user_id = auth.uid() AND
  get_user_role() IN ('DIREZIONE', 'AMMINISTRATORE')
);

DROP POLICY IF EXISTS "messages_update_read" ON messages;
CREATE POLICY "messages_update_read" ON messages FOR UPDATE
TO authenticated USING (to_user_id = auth.uid())
WITH CHECK (to_user_id = auth.uid());

DROP POLICY IF EXISTS "messages_delete_admin" ON messages;
CREATE POLICY "messages_delete_admin" ON messages FOR DELETE
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

-- ============================================================
-- RLS POLICIES - AUDIT LOGS
-- ============================================================

DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT
TO authenticated USING (get_user_role() = 'AMMINISTRATORE');

DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
TO authenticated WITH CHECK (true);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS applications_updated_at ON job_applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Enable Realtime for notifications and messages
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
