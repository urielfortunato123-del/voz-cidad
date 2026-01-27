-- Corrigir search_path das funções
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_confirmations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reports
  SET confirmations_count = confirmations_count + 1
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_flags()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reports
  SET flags_count = flags_count + 1,
      status = CASE WHEN flags_count >= 4 THEN 'SOB_REVISAO'::public.report_status ELSE status END
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;