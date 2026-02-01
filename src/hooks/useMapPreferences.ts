import { useState, useEffect, useCallback } from 'react';
import type { CategoryKey } from '@/lib/constants';
import { CATEGORIES } from '@/lib/constants';
import { FACILITY_TYPES } from '@/components/map/FacilityLegend';

const STORAGE_KEY = 'map-preferences';

interface MapPreferences {
  layer: 'street' | 'satellite' | 'terrain' | 'dark';
  radiusFilter: number;
  showReports: boolean;
  activeCategories: CategoryKey[];
  activeFacilityFilters: string[];
  lastCenter?: [number, number];
  lastZoom?: number;
}

const DEFAULT_PREFERENCES: MapPreferences = {
  layer: 'street',
  radiusFilter: 0,
  showReports: true,
  activeCategories: Object.keys(CATEGORIES) as CategoryKey[],
  activeFacilityFilters: FACILITY_TYPES.map((f) => f.key),
};

function loadPreferences(): MapPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load map preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: Partial<MapPreferences>) {
  try {
    const current = loadPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save map preferences:', e);
  }
}

export function useMapPreferences() {
  const [preferences, setPreferences] = useState<MapPreferences>(loadPreferences);

  // Save whenever preferences change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const updatePreference = useCallback(
    <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleCategory = useCallback((category: CategoryKey) => {
    setPreferences((prev) => {
      const current = prev.activeCategories;
      if (current.includes(category)) {
        // Don't allow removing the last category
        if (current.length === 1) return prev;
        return {
          ...prev,
          activeCategories: current.filter((c) => c !== category),
        };
      }
      return { ...prev, activeCategories: [...current, category] };
    });
  }, []);

  const toggleFacilityFilter = useCallback((key: string) => {
    setPreferences((prev) => {
      const current = prev.activeFacilityFilters;
      if (current.includes(key)) {
        return {
          ...prev,
          activeFacilityFilters: current.filter((f) => f !== key),
        };
      }
      return { ...prev, activeFacilityFilters: [...current, key] };
    });
  }, []);

  const setAllCategories = useCallback((categories: CategoryKey[]) => {
    setPreferences((prev) => ({ ...prev, activeCategories: categories }));
  }, []);

  return {
    preferences,
    updatePreference,
    toggleCategory,
    toggleFacilityFilter,
    setAllCategories,
  };
}
