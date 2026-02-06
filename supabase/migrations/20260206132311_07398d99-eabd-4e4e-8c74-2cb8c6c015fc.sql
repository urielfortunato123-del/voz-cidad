-- Remover índices parciais e criar constraints normais
DROP INDEX IF EXISTS idx_atlas_mandates_unique;
DROP INDEX IF EXISTS idx_atlas_contacts_person_unique;

-- Constraint normal para mandates (pessoa + cargo + local + ativo)
ALTER TABLE public.atlas_mandates 
ADD CONSTRAINT atlas_mandates_active_unique 
UNIQUE (person_id, office_id, location_id);

-- Constraint para contacts
ALTER TABLE public.atlas_contacts 
ADD CONSTRAINT atlas_contacts_person_unique 
UNIQUE (person_id);