import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStates() {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations_states')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCities(uf: string | null) {
  return useQuery({
    queryKey: ['cities', uf],
    queryFn: async () => {
      if (!uf) return [];
      
      const { data, error } = await supabase
        .from('locations_cities')
        .select('*')
        .eq('uf', uf)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!uf,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
