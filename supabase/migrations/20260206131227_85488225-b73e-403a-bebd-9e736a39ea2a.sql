-- =====================================================
-- ATLAS POLÍTICO BRASIL - ESTRUTURA COMPLETA
-- =====================================================

-- Criar ENUMs
CREATE TYPE public.location_level AS ENUM ('MUNICIPAL', 'ESTADUAL', 'FEDERAL');
CREATE TYPE public.office_category AS ENUM ('EXECUTIVO', 'LEGISLATIVO', 'SECRETARIA', 'AUTARQUIA');
CREATE TYPE public.mandate_status AS ENUM ('ELEITO', 'EM_EXERCICIO', 'SUPLENTE', 'AFASTADO', 'EXONERADO', 'DESCONHECIDO');
CREATE TYPE public.confidence_level AS ENUM ('CONFIRMADO', 'NAO_CONFIRMADO');
CREATE TYPE public.source_domain_type AS ENUM ('GOV_BR', 'CAMARA', 'SENADO', 'TSE', 'OUTRO');
CREATE TYPE public.source_method AS ENUM ('API', 'MANUAL', 'IMPORT');
CREATE TYPE public.job_status AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');
CREATE TYPE public.audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- =====================================================
-- TABELA: atlas_locations (Municípios, Estados, Federal)
-- =====================================================
CREATE TABLE public.atlas_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level location_level NOT NULL,
  name VARCHAR(255) NOT NULL,
  uf VARCHAR(2),
  ibge_code VARCHAR(10),
  region VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level, uf, ibge_code)
);

-- Index para buscas rápidas
CREATE INDEX idx_atlas_locations_level ON public.atlas_locations(level);
CREATE INDEX idx_atlas_locations_uf ON public.atlas_locations(uf);
CREATE INDEX idx_atlas_locations_name ON public.atlas_locations(name);

-- RLS
ALTER TABLE public.atlas_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are publicly readable"
  ON public.atlas_locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON public.atlas_locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABELA: atlas_offices (Catálogo de Cargos)
-- =====================================================
CREATE TABLE public.atlas_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level location_level NOT NULL,
  name VARCHAR(255) NOT NULL,
  category office_category NOT NULL,
  is_elective BOOLEAN NOT NULL DEFAULT false,
  parent_office_id UUID REFERENCES public.atlas_offices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level, name, category)
);

CREATE INDEX idx_atlas_offices_level ON public.atlas_offices(level);
CREATE INDEX idx_atlas_offices_category ON public.atlas_offices(category);

ALTER TABLE public.atlas_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offices are publicly readable"
  ON public.atlas_offices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage offices"
  ON public.atlas_offices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABELA: atlas_sources (Fontes de Dados)
-- =====================================================
CREATE TABLE public.atlas_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  url TEXT,
  publisher VARCHAR(255),
  domain_type source_domain_type NOT NULL DEFAULT 'OUTRO',
  method source_method NOT NULL DEFAULT 'MANUAL',
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atlas_sources_domain ON public.atlas_sources(domain_type);
CREATE INDEX idx_atlas_sources_collected ON public.atlas_sources(collected_at);

ALTER TABLE public.atlas_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sources are publicly readable"
  ON public.atlas_sources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sources"
  ON public.atlas_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABELA: atlas_people (Pessoas Públicas)
-- =====================================================
CREATE TABLE public.atlas_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  cpf_hash VARCHAR(64), -- Hash do CPF para evitar duplicatas, nunca o CPF real
  party VARCHAR(50),
  photo_url TEXT,
  gender VARCHAR(20),
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atlas_people_name ON public.atlas_people(full_name);
CREATE INDEX idx_atlas_people_party ON public.atlas_people(party);
CREATE UNIQUE INDEX idx_atlas_people_cpf ON public.atlas_people(cpf_hash) WHERE cpf_hash IS NOT NULL;

ALTER TABLE public.atlas_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People are publicly readable"
  ON public.atlas_people FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage people"
  ON public.atlas_people FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_atlas_people_updated_at
  BEFORE UPDATE ON public.atlas_people
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: atlas_contacts (Contatos Públicos)
-- =====================================================
CREATE TABLE public.atlas_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.atlas_people(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  website TEXT,
  social_links JSONB DEFAULT '{}',
  source_id UUID REFERENCES public.atlas_sources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atlas_contacts_person ON public.atlas_contacts(person_id);

ALTER TABLE public.atlas_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts are publicly readable"
  ON public.atlas_contacts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage contacts"
  ON public.atlas_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_atlas_contacts_updated_at
  BEFORE UPDATE ON public.atlas_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: atlas_mandates (Mandatos/Ocupação de Cargos)
-- =====================================================
CREATE TABLE public.atlas_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.atlas_locations(id),
  office_id UUID NOT NULL REFERENCES public.atlas_offices(id),
  person_id UUID NOT NULL REFERENCES public.atlas_people(id),
  status mandate_status NOT NULL DEFAULT 'DESCONHECIDO',
  start_date DATE,
  end_date DATE,
  confidence confidence_level NOT NULL DEFAULT 'NAO_CONFIRMADO',
  source_id UUID REFERENCES public.atlas_sources(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atlas_mandates_location ON public.atlas_mandates(location_id);
CREATE INDEX idx_atlas_mandates_office ON public.atlas_mandates(office_id);
CREATE INDEX idx_atlas_mandates_person ON public.atlas_mandates(person_id);
CREATE INDEX idx_atlas_mandates_status ON public.atlas_mandates(status);
CREATE INDEX idx_atlas_mandates_dates ON public.atlas_mandates(start_date, end_date);

ALTER TABLE public.atlas_mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mandates are publicly readable"
  ON public.atlas_mandates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage mandates"
  ON public.atlas_mandates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_atlas_mandates_updated_at
  BEFORE UPDATE ON public.atlas_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: atlas_elections (Dados do TSE)
-- =====================================================
CREATE TABLE public.atlas_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  round INTEGER DEFAULT 1,
  location_id UUID NOT NULL REFERENCES public.atlas_locations(id),
  office_id UUID NOT NULL REFERENCES public.atlas_offices(id),
  person_name VARCHAR(255) NOT NULL,
  cpf_hash VARCHAR(64),
  party VARCHAR(50),
  coalition VARCHAR(500),
  votes INTEGER,
  elected BOOLEAN NOT NULL DEFAULT false,
  source_id UUID REFERENCES public.atlas_sources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year, round, location_id, office_id, person_name)
);

CREATE INDEX idx_atlas_elections_year ON public.atlas_elections(year);
CREATE INDEX idx_atlas_elections_location ON public.atlas_elections(location_id);
CREATE INDEX idx_atlas_elections_elected ON public.atlas_elections(elected);

ALTER TABLE public.atlas_elections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elections are publicly readable"
  ON public.atlas_elections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage elections"
  ON public.atlas_elections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TABELA: atlas_change_log (Auditoria Total)
-- =====================================================
CREATE TABLE public.atlas_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  before_data JSONB,
  after_data JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atlas_change_log_entity ON public.atlas_change_log(entity, entity_id);
CREATE INDEX idx_atlas_change_log_action ON public.atlas_change_log(action);
CREATE INDEX idx_atlas_change_log_user ON public.atlas_change_log(user_id);
CREATE INDEX idx_atlas_change_log_created ON public.atlas_change_log(created_at DESC);

ALTER TABLE public.atlas_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Change log readable by admins"
  ON public.atlas_change_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Change log writable by system"
  ON public.atlas_change_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TABELA: atlas_jobs (Jobs de Coleta)
-- =====================================================
CREATE TABLE public.atlas_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,
  target_level location_level,
  target_location_id UUID REFERENCES public.atlas_locations(id),
  status job_status NOT NULL DEFAULT 'RUNNING',
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  log JSONB DEFAULT '[]',
  error_message TEXT,
  created_by UUID
);

CREATE INDEX idx_atlas_jobs_status ON public.atlas_jobs(status);
CREATE INDEX idx_atlas_jobs_type ON public.atlas_jobs(job_type);
CREATE INDEX idx_atlas_jobs_started ON public.atlas_jobs(started_at DESC);

ALTER TABLE public.atlas_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs readable by admins"
  ON public.atlas_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Jobs writable by admins"
  ON public.atlas_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FUNÇÃO: Registrar mudanças automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.atlas_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.atlas_change_log (entity, entity_id, action, after_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'CREATE', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.atlas_change_log (entity, entity_id, action, before_data, after_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.atlas_change_log (entity, entity_id, action, before_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Aplicar trigger de auditoria nas tabelas principais
CREATE TRIGGER atlas_people_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.atlas_people
  FOR EACH ROW EXECUTE FUNCTION public.atlas_audit_trigger();

CREATE TRIGGER atlas_mandates_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.atlas_mandates
  FOR EACH ROW EXECUTE FUNCTION public.atlas_audit_trigger();

CREATE TRIGGER atlas_contacts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.atlas_contacts
  FOR EACH ROW EXECUTE FUNCTION public.atlas_audit_trigger();