-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table to cache public officials data
CREATE TABLE public.public_officials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  photo_url TEXT,
  party VARCHAR,
  uf VARCHAR REFERENCES locations_states(uf),
  city VARCHAR,
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  scope VARCHAR NOT NULL CHECK (scope IN ('MUNICIPAL', 'ESTADUAL', 'FEDERAL')),
  active BOOLEAN NOT NULL DEFAULT true,
  email VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, role)
);

-- Enable RLS
ALTER TABLE public.public_officials ENABLE ROW LEVEL SECURITY;

-- Public read access for active officials
CREATE POLICY "Public officials are publicly readable"
  ON public.public_officials
  FOR SELECT
  USING (active = true);

-- Admins can manage officials
CREATE POLICY "Admins can manage public officials"
  ON public.public_officials
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster queries
CREATE INDEX idx_public_officials_uf ON public.public_officials(uf);
CREATE INDEX idx_public_officials_city ON public.public_officials(city);
CREATE INDEX idx_public_officials_role ON public.public_officials(role);
CREATE INDEX idx_public_officials_scope ON public.public_officials(scope);
CREATE INDEX idx_public_officials_category_tags ON public.public_officials USING GIN(category_tags);

-- Add trigger for updated_at
CREATE TRIGGER update_public_officials_updated_at
  BEFORE UPDATE ON public.public_officials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add column to reports to optionally link to a public official
ALTER TABLE public.reports 
  ADD COLUMN target_official_id UUID REFERENCES public.public_officials(id);

-- Create index for the new column
CREATE INDEX idx_reports_target_official ON public.reports(target_official_id);