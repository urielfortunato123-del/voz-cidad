import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LocationSelector } from '@/components/LocationSelector';
import { setSelectedLocation } from '@/lib/device';

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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        className="flex-1 px-6 py-12 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
          >
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
            >
              <Navigation className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Onde você está?
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Selecione seu estado e cidade para ver as denúncias da sua região
            </p>
          </motion.div>
          
          {/* Location Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
          >
            <LocationSelector
              selectedUf={selected?.uf || null}
              selectedCity={selected?.city || null}
              onSelect={handleSelect}
              showLabel={false}
            />
          </motion.div>

          {/* Selected location display */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 glass rounded-2xl flex items-center gap-3"
            >
              <div className="p-2 bg-primary/20 rounded-xl">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Localização selecionada</p>
                <p className="font-bold text-foreground">{selected.city}/{selected.uf}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div 
        className="px-6 pb-10 safe-area-bottom relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Button 
          onClick={handleContinue}
          disabled={!selected}
          className="w-full h-14 text-lg font-bold"
          size="lg"
        >
          Entrar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
