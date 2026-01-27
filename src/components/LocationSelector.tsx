import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStates, useCities } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  selectedUf: string | null;
  selectedCity: string | null;
  onSelect: (uf: string, city: string) => void;
  onClear?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function LocationSelector({ 
  selectedUf, 
  selectedCity, 
  onSelect, 
  onClear,
  showLabel = true,
  className 
}: LocationSelectorProps) {
  const [uf, setUf] = useState<string | null>(selectedUf);
  const [city, setCity] = useState<string | null>(selectedCity);
  
  const { data: states, isLoading: loadingStates } = useStates();
  const { data: cities, isLoading: loadingCities } = useCities(uf);
  
  useEffect(() => {
    setUf(selectedUf);
    setCity(selectedCity);
  }, [selectedUf, selectedCity]);
  
  const handleUfChange = (value: string) => {
    setUf(value);
    setCity(null);
  };
  
  const handleCityChange = (value: string) => {
    setCity(value);
    if (uf && value) {
      onSelect(uf, value);
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {showLabel && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">Selecione seu local</span>
        </div>
      )}
      
      <div className="space-y-3">
        <Select value={uf || ''} onValueChange={handleUfChange}>
          <SelectTrigger className="input-accessible">
            <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione o Estado'} />
          </SelectTrigger>
          <SelectContent>
            {states?.map((state) => (
              <SelectItem key={state.uf} value={state.uf}>
                {state.name} ({state.uf})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={city || ''} 
          onValueChange={handleCityChange}
          disabled={!uf || loadingCities}
        >
          <SelectTrigger className="input-accessible">
            <SelectValue placeholder={
              !uf ? 'Selecione primeiro o Estado' : 
              loadingCities ? 'Carregando cidades...' : 
              'Selecione a Cidade'
            } />
          </SelectTrigger>
          <SelectContent>
            {cities?.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedUf && selectedCity && onClear && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          className="text-muted-foreground"
        >
          Trocar localização
        </Button>
      )}
    </div>
  );
}
