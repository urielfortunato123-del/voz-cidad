import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSelector } from '@/components/LocationSelector';
import { setSelectedLocation } from '@/lib/device';
import { APP_NAME } from '@/lib/constants';

export default function SelectLocation() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<{ uf: string; city: string } | null>(null);
  
  const handleSelect = (uf: string, city: string) => {
    setSelected({ uf, city });
  };
  
  const handleContinue = () => {
    if (selected) {
      setSelectedLocation(selected.uf, selected.city);
      navigate('/home');
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-6 py-12">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Onde você está?
            </h1>
            <p className="text-muted-foreground">
              Selecione seu estado e cidade para ver as denúncias da sua região
            </p>
          </div>
          
          {/* Location Selector */}
          <LocationSelector
            selectedUf={selected?.uf || null}
            selectedCity={selected?.city || null}
            onSelect={handleSelect}
            showLabel={false}
          />
        </div>
      </div>
      
      <div className="px-6 pb-8 safe-area-bottom">
        <Button 
          onClick={handleContinue}
          disabled={!selected}
          className="w-full btn-touch text-lg"
          size="lg"
        >
          Entrar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
