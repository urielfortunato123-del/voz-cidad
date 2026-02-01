import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';

export interface SuggestedAgency {
  name: string;
  email: string;
  scope: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  confidence: 'alta' | 'media';
  description?: string;
}

interface UseSuggestAgenciesResult {
  suggestions: SuggestedAgency[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: (uf: string, city: string, category: CategoryKey) => Promise<void>;
}

export function useSuggestAgencies(): UseSuggestAgenciesResult {
  const [suggestions, setSuggestions] = useState<SuggestedAgency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (uf: string, city: string, category: CategoryKey) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const categoryLabel = CATEGORIES[category]?.label || category;

      const { data, error: fnError } = await supabase.functions.invoke('suggest-agencies', {
        body: { uf, city, category, categoryLabel },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuggestions(data?.suggestions || []);
    } catch (err) {
      console.error('Error fetching agency suggestions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar sugestões');
    } finally {
      setIsLoading(false);
    }
  };

  return { suggestions, isLoading, error, fetchSuggestions };
}
