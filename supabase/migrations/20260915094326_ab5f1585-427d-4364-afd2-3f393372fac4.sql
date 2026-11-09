
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin_officer','station_manager','account_officer');
CREATE TYPE public.corr_status AS ENUM ('pending','assigned','under_review','responded','closed','returned');
CREATE TYPE public.corr_priority AS ENUM ('low','normal','high','urgent');
CREATE TYPE public.corr_direction AS ENUM ('incoming','outgoing');

-- ===== DEPARTMENTS =====
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  intended_role public.app_role NOT NULL DEFAULT 'account_officer',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  station text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(intended_role);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- ===== CORRESPONDENCE =====
CREATE SEQUENCE public.correspondence_ref_seq START 1001;

CREATE TABLE public.correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  direction public.corr_direction NOT NULL DEFAULT 'incoming',
  date_received date NOT NULL DEFAULT current_date,
  letter_title text NOT NULL,
  company_name text NOT NULL,
  contact_phone text,
  priority public.corr_priority NOT NULL DEFAULT 'normal',
  status public.corr_status NOT NULL DEFAULT 'pending',
  admin_officer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  station_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  account_officer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_corr_ref ON public.correspondence(reference_number);
CREATE INDEX idx_corr_company ON public.correspondence(company_name);
CREATE INDEX idx_corr_title ON public.correspondence(letter_title);
CREATE INDEX idx_corr_phone ON public.correspondence(contact_phone);
CREATE INDEX idx_corr_date ON public.correspondence(date_received);
CREATE INDEX idx_corr_status ON public.correspondence(status);
CREATE INDEX idx_corr_account_officer ON public.correspondence(account_officer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.correspondence TO authenticated;
GRANT ALL ON public.correspondence TO service_role;
ALTER TABLE public.correspondence ENABLE ROW LEVEL SECURITY;

-- ===== STATUS HISTORY =====
CREATE TABLE public.correspondence_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correspondence_id uuid NOT NULL REFERENCES public.correspondence(id) ON DELETE CASCADE,
  old_status public.corr_status,
  new_status public.corr_status NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_corr ON public.correspondence_status_history(correspondence_id);
GRANT SELECT, INSERT ON public.correspondence_status_history TO authenticated;
GRANT ALL ON public.correspondence_status_history TO service_role;
ALTER TABLE public.correspondence_status_history ENABLE ROW LEVEL SECURITY;

-- ===== TRIGGERS =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_corr_updated BEFORE UPDATE ON public.correspondence
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_reference_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := 'LIRS/COR/' || to_char(now(),'YYYY') || '/' ||
      lpad(nextval('public.correspondence_ref_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_corr_ref BEFORE INSERT ON public.correspondence
FOR EACH ROW EXECUTE FUNCTION public.set_reference_number();

-- log every status change automatically
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.correspondence_status_history(correspondence_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, NULL, NEW.status, public.current_profile_id(), 'Correspondence registered');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.correspondence_status_history(correspondence_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, public.current_profile_id(), NEW.remarks);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_corr_status_log AFTER INSERT OR UPDATE ON public.correspondence
FOR EACH ROW EXECUTE FUNCTION public.log_status_change();

-- ===== POLICIES =====
CREATE POLICY "Staff can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin_officer')) WITH CHECK (public.has_role(auth.uid(),'admin_officer'));

CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin_officer')) WITH CHECK (public.has_role(auth.uid(),'admin_officer'));

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin_officer'));

CREATE POLICY "Staff can view correspondence" ON public.correspondence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers create correspondence" ON public.correspondence FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin_officer') OR public.has_role(auth.uid(),'station_manager'));
CREATE POLICY "Admins and managers update correspondence" ON public.correspondence FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin_officer') OR public.has_role(auth.uid(),'station_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin_officer') OR public.has_role(auth.uid(),'station_manager'));
CREATE POLICY "Account officers update assigned correspondence" ON public.correspondence FOR UPDATE TO authenticated
  USING (account_officer_id = public.current_profile_id())
  WITH CHECK (account_officer_id = public.current_profile_id());
CREATE POLICY "Admins delete correspondence" ON public.correspondence FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin_officer'));

CREATE POLICY "Staff view history" ON public.correspondence_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert history" ON public.correspondence_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- ===== READ-ONLY SQL PRACTICE FUNCTION (service_role only) =====
CREATE OR REPLACE FUNCTION public.exec_readonly_sql(query_text text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json; cleaned text;
BEGIN
  cleaned := lower(btrim(regexp_replace(query_text, ';\s*$', '')));
  IF cleaned !~ '^(select|with)\s' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed.';
  END IF;
  IF cleaned ~ ';' THEN RAISE EXCEPTION 'Multiple statements are not allowed.'; END IF;
  IF cleaned ~* '\y(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|vacuum)\y' THEN
    RAISE EXCEPTION 'Destructive or non-read statements are blocked.';
  END IF;
  IF cleaned ~* '\yauth\.|\ystorage\.|\yvault\.|pg_authid|pg_shadow' THEN
    RAISE EXCEPTION 'Access to system or auth schemas is blocked.';
  END IF;
  SET LOCAL transaction_read_only = on;
  EXECUTE 'SELECT coalesce(json_agg(t), ''[]''::json) FROM (' || regexp_replace(query_text, ';\s*$', '') || ' LIMIT 200) t' INTO result;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.exec_readonly_sql(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_readonly_sql(text) TO service_role;

-- ===== SEED DATA =====
INSERT INTO public.departments (name, code) VALUES
  ('Corporate Tax Audit','CTA'),
  ('Personal Income Tax','PIT'),
  ('Tax Payer Services','TPS'),
  ('Legal & Enforcement','LGE'),
  ('Revenue Monitoring','RVM'),
  ('Informal Sector','IFS');

INSERT INTO public.profiles (full_name, email, intended_role, department_id, station) VALUES
  ('Adebayo Ogunlesi','admin@lirs.gov.ng','admin_officer',(SELECT id FROM public.departments WHERE code='CTA'),'Ikeja HQ'),
  ('Funmilayo Adeyemi','admin2@lirs.gov.ng','admin_officer',(SELECT id FROM public.departments WHERE code='TPS'),'Alausa'),
  ('Chukwudi Nwosu','admin3@lirs.gov.ng','admin_officer',(SELECT id FROM public.departments WHERE code='LGE'),'Ikeja HQ'),
  ('Yetunde Balogun','manager@lirs.gov.ng','station_manager',(SELECT id FROM public.departments WHERE code='PIT'),'Victoria Island'),
  ('Ibrahim Sanusi','manager2@lirs.gov.ng','station_manager',(SELECT id FROM public.departments WHERE code='RVM'),'Apapa'),
  ('Ngozi Okereke','manager3@lirs.gov.ng','station_manager',(SELECT id FROM public.departments WHERE code='IFS'),'Surulere'),
  ('Tolu Akinwale','officer@lirs.gov.ng','account_officer',(SELECT id FROM public.departments WHERE code='CTA'),'Ikeja HQ'),
  ('Blessing Eze','officer2@lirs.gov.ng','account_officer',(SELECT id FROM public.departments WHERE code='PIT'),'Lekki'),
  ('Musa Abdullahi','officer3@lirs.gov.ng','account_officer',(SELECT id FROM public.departments WHERE code='TPS'),'Ikorodu'),
  ('Kemi Oyelaran','officer4@lirs.gov.ng','account_officer',(SELECT id FROM public.departments WHERE code='RVM'),'Apapa');

INSERT INTO public.correspondence
  (reference_number, direction, date_received, letter_title, company_name, contact_phone, priority, status,
   admin_officer_id, station_manager_id, account_officer_id, department_id, remarks)
SELECT
  'LIRS/COR/2026/' || lpad((100 + g)::text, 4, '0'),
  (ARRAY['incoming','outgoing']::public.corr_direction[])[1 + (g % 4 = 0)::int],
  (current_date - ((g * 5) % 210))::date,
  (ARRAY[
    'Request for Tax Clearance Certificate',
    'Objection to Assessment Notice',
    'Application for PAYE Remittance Schedule',
    'Notice of Change of Business Address',
    'Request for Instalment Payment Plan',
    'Submission of Annual Returns',
    'Query on Withholding Tax Credit',
    'Request for Tax Audit Reconciliation',
    'Application for Tax Exemption Status',
    'Complaint on Duplicate Assessment'
  ])[1 + (g % 10)],
  (ARRAY[
    'Zenith Holdings Limited','Lagoon Foods Nigeria Plc','Eko Atlantic Developers',
    'Ikeja Electric Contractors Ltd','Marina Logistics Limited','Yaba Tech Innovations Ltd',
    'Apapa Ports Services Ltd','Lekki Hospitality Group','Surulere Textiles Nigeria Ltd',
    'Broad Street Capital Partners','Oshodi Motors Limited','Victoria Island Realty Plc'
  ])[1 + (g % 12)],
  '080' || lpad(((g * 7919) % 100000000)::text, 8, '0'),
  (ARRAY['low','normal','normal','high','urgent']::public.corr_priority[])[1 + (g % 5)],
  (ARRAY['pending','assigned','under_review','responded','closed','returned']::public.corr_status[])[1 + (g % 6)],
  (SELECT id FROM public.profiles WHERE intended_role='admin_officer' ORDER BY email OFFSET (g % 3) LIMIT 1),
  (SELECT id FROM public.profiles WHERE intended_role='station_manager' ORDER BY email OFFSET (g % 3) LIMIT 1),
  (SELECT id FROM public.profiles WHERE intended_role='account_officer' ORDER BY email OFFSET (g % 4) LIMIT 1),
  (SELECT id FROM public.departments ORDER BY code OFFSET (g % 6) LIMIT 1),
  (ARRAY[
    'Awaiting supporting documents from taxpayer.',
    'Forwarded to audit unit for verification.',
    'Response letter drafted and under review.',
    'Closed after full remittance confirmed.',
    'Returned for incomplete documentation.'
  ])[1 + (g % 5)]
FROM generate_series(1, 52) AS g;
