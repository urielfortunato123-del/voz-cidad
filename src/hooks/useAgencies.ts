import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CategoryKey } from '@/lib/constants';

export interface Agency {
  id: string;
  scope: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  uf: string;
  city: string | null;
  name: string;
  email: string;
  category_tags: string[];
  active: boolean;
  created_at: string;
}

export function useAgencies(uf: string | null, city: string | null, category?: CategoryKey | null) {
  return useQuery({
    queryKey: ['agencies', uf, city, category],
    queryFn: async () => {
      if (!uf) return [];
      
      let query = supabase
        .from('agencies')
        .select('*')
        .eq('uf', uf)
        .eq('active', true)
        .order('scope', { ascending: true })
        .order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by city (null for state-level) and category
      let filtered = (data as Agency[]).filter(agency => 
        agency.city === null || agency.city === city
      );
      
      if (category) {
        filtered = filtered.filter(agency => 
          agency.category_tags.includes(category)
        );
      }
      
      return filtered;
    },
    enabled: !!uf,
  });
}
