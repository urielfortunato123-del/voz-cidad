-- Adicionar unique constraints para upserts funcionarem
CREATE UNIQUE INDEX idx_atlas_mandates_unique 
ON public.atlas_mandates(person_id, office_id, location_id) 
WHERE end_date IS NULL;

CREATE UNIQUE INDEX idx_atlas_contacts_person_unique 
ON public.atlas_contacts(person_id);