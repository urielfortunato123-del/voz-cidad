-- Tabela de Estados
CREATE TABLE public.locations_states (
  uf VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Tabela de Cidades
CREATE TABLE public.locations_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf VARCHAR(2) NOT NULL REFERENCES public.locations_states(uf),
  name VARCHAR(200) NOT NULL
);

-- Enum para status das denúncias
CREATE TYPE public.report_status AS ENUM (
  'RECEBIDA',
  'EM_ANALISE',
  'ENCAMINHADA',
  'RESPONDIDA',
  'RESOLVIDA',
  'ARQUIVADA',
  'SOB_REVISAO'
);

-- Enum para categorias
CREATE TYPE public.report_category AS ENUM (
  'SAUDE',
  'OBRAS',
  'EDUCACAO',
  'SERVICOS_URBANOS',
  'MEIO_AMBIENTE',
  'SEGURANCA',
  'CORRUPCAO'
);

-- Enum para escopo do órgão
CREATE TYPE public.agency_scope AS ENUM (
  'MUNICIPAL',
  'ESTADUAL',
  'FEDERAL'
);

-- Tabela de Denúncias
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol VARCHAR(12) UNIQUE NOT NULL,
  uf VARCHAR(2) NOT NULL REFERENCES public.locations_states(uf),
  city VARCHAR(200) NOT NULL,
  category public.report_category NOT NULL,
  title VARCHAR(80),
  description TEXT NOT NULL CHECK (char_length(description) <= 1000),
  occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  address_text VARCHAR(500),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  author_name VARCHAR(200),
  author_contact VARCHAR(200),
  show_name_publicly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.report_status NOT NULL DEFAULT 'RECEBIDA',
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  flags_count INTEGER NOT NULL DEFAULT 0,
  device_id VARCHAR(100)
);

-- Tabela de Evidências
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Confirmações
CREATE TABLE public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  device_or_user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, device_or_user_id)
);

-- Tabela de Flags de Moderação
CREATE TABLE public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  device_or_user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, device_or_user_id)
);

-- Tabela de Órgãos
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.agency_scope NOT NULL,
  uf VARCHAR(2) NOT NULL REFERENCES public.locations_states(uf),
  city VARCHAR(200),
  name VARCHAR(300) NOT NULL,
  email VARCHAR(255) NOT NULL,
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_reports_uf_city ON public.reports(uf, city);
CREATE INDEX idx_reports_category ON public.reports(category);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_locations_cities_uf ON public.locations_cities(uf);
CREATE INDEX idx_agencies_uf_city ON public.agencies(uf, city);
CREATE INDEX idx_agencies_category_tags ON public.agencies USING GIN(category_tags);

-- Habilitar RLS
ALTER TABLE public.locations_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Locations são públicas (leitura)
CREATE POLICY "Locations states are publicly readable"
ON public.locations_states FOR SELECT
USING (true);

CREATE POLICY "Locations cities are publicly readable"
ON public.locations_cities FOR SELECT
USING (true);

-- Políticas RLS - Reports
CREATE POLICY "Reports are publicly readable except hidden"
ON public.reports FOR SELECT
USING (status != 'SOB_REVISAO' OR flags_count < 5);

CREATE POLICY "Anyone can create reports"
ON public.reports FOR INSERT
WITH CHECK (true);

-- Políticas RLS - Evidences
CREATE POLICY "Evidences are publicly readable"
ON public.evidences FOR SELECT
USING (true);

CREATE POLICY "Anyone can add evidences"
ON public.evidences FOR INSERT
WITH CHECK (true);

-- Políticas RLS - Confirmations
CREATE POLICY "Confirmations are publicly readable"
ON public.confirmations FOR SELECT
USING (true);

CREATE POLICY "Anyone can add confirmations"
ON public.confirmations FOR INSERT
WITH CHECK (true);

-- Políticas RLS - Moderation Flags
CREATE POLICY "Anyone can add flags"
ON public.moderation_flags FOR INSERT
WITH CHECK (true);

-- Políticas RLS - Agencies
CREATE POLICY "Active agencies are publicly readable"
ON public.agencies FOR SELECT
USING (active = true);

-- Função para gerar protocolo único
CREATE OR REPLACE FUNCTION public.generate_protocol()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar confirmações
CREATE OR REPLACE FUNCTION public.increment_confirmations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reports
  SET confirmations_count = confirmations_count + 1
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_confirmation_insert
AFTER INSERT ON public.confirmations
FOR EACH ROW
EXECUTE FUNCTION public.increment_confirmations();

-- Função para incrementar flags
CREATE OR REPLACE FUNCTION public.increment_flags()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reports
  SET flags_count = flags_count + 1,
      status = CASE WHEN flags_count >= 4 THEN 'SOB_REVISAO'::public.report_status ELSE status END
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_flag_insert
AFTER INSERT ON public.moderation_flags
FOR EACH ROW
EXECUTE FUNCTION public.increment_flags();

-- Bucket para evidências
INSERT INTO storage.buckets (id, name, public) VALUES ('evidences', 'evidences', true);

-- Políticas de storage
CREATE POLICY "Anyone can upload evidences"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidences');

CREATE POLICY "Evidences are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidences');