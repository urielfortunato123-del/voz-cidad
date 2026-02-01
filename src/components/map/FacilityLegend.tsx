import { Card, CardContent } from '@/components/ui/card';

interface FacilityType {
  key: string;
  label: string;
  color: string;
}

const FACILITY_TYPES: FacilityType[] = [
  { key: 'hospital', label: 'Hospitais', color: '#E91E63' },
  { key: 'upa', label: 'UPAs', color: '#F44336' },
  { key: 'ubs', label: 'UBS', color: '#FF5722' },
  { key: 'escola_municipal', label: 'Escolas Municipais', color: '#2196F3' },
  { key: 'escola_estadual', label: 'Escolas Estaduais', color: '#3F51B5' },
  { key: 'prefeitura', label: 'Prefeituras', color: '#9C27B0' },
  { key: 'camara', label: 'Câmaras Municipais', color: '#673AB7' },
];

interface FacilityLegendProps {
  activeFilters: string[];
  onFilterToggle: (key: string) => void;
}

export function FacilityLegend({ activeFilters, onFilterToggle }: FacilityLegendProps) {
  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Filtrar Estabelecimentos</h3>
        <div className="flex flex-wrap gap-2">
          {FACILITY_TYPES.map(({ key, label, color }) => {
            const isActive = activeFilters.includes(key);
            return (
              <button
                key={key}
                onClick={() => onFilterToggle(key)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all ${
                  isActive 
                    ? 'bg-primary/10 ring-1 ring-primary' 
                    : 'bg-muted/50 opacity-60 hover:opacity-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground">{label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { FACILITY_TYPES };
