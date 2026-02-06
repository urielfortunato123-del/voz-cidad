import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicOfficial {
  id: string;
  external_id: string;
  name: string;
  role: string;
  role_label: string;
  photo_url: string | null;
  party: string | null;
  uf: string;
  city: string | null;
  category_tags: string[];
  scope: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  email: string | null;
  phone: string | null;
}

interface UsePublicOfficialsParams {
  uf: string | null;
  city?: string | null;
  category?: string | null;
}

export function usePublicOfficials({ uf, city, category }: UsePublicOfficialsParams) {
  return useQuery({
    queryKey: ['public-officials', uf, city, category],
    queryFn: async (): Promise<PublicOfficial[]> => {
      if (!uf) return [];

      const { data, error } = await supabase.functions.invoke('fetch-officials', {
        body: { uf, city, category },
      });

      if (error) {
        console.error('Erro ao buscar servidores públicos:', error);
        throw error;
      }

      return data?.officials || [];
    },
    enabled: !!uf,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
