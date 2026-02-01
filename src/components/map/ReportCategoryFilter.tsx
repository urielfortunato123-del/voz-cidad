import { CATEGORIES, type CategoryKey } from '@/lib/constants';

interface ReportCategoryFilterProps {
  activeCategories: CategoryKey[];
  onCategoryToggle: (category: CategoryKey) => void;
  totalReports?: number;
}

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  SAUDE: '#E91E63',
  OBRAS: '#FF9800',
  EDUCACAO: '#2196F3',
  SERVICOS_URBANOS: '#26A69A',
  MEIO_AMBIENTE: '#4CAF50',
  SEGURANCA: '#9C27B0',
  CORRUPCAO: '#F44336',
};

export function ReportCategoryFilter({
  activeCategories,
  onCategoryToggle,
  totalReports,
}: ReportCategoryFilterProps) {
  const allActive = activeCategories.length === Object.keys(CATEGORIES).length;

  const toggleAll = () => {
    if (allActive) {
      // Deselect all - but keep at least one active
      onCategoryToggle(Object.keys(CATEGORIES)[0] as CategoryKey);
    } else {
      // Select all
      Object.keys(CATEGORIES).forEach((key) => {
        if (!activeCategories.includes(key as CategoryKey)) {
          onCategoryToggle(key as CategoryKey);
        }
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filtrar Denúncias</h3>
        <button
          onClick={toggleAll}
          className="text-xs text-primary hover:underline"
        >
          {allActive ? 'Desmarcar todas' : 'Selecionar todas'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORIES) as [CategoryKey, { label: string }][]).map(
          ([key, { label }]) => {
            const isActive = activeCategories.includes(key);
            const color = CATEGORY_COLORS[key];

            return (
              <button
                key={key}
                onClick={() => onCategoryToggle(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all border ${
                  isActive
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-75 border-transparent'
                }`}
                style={{
                  backgroundColor: isActive ? `${color}20` : 'transparent',
                  borderColor: isActive ? color : 'transparent',
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className={isActive ? 'font-medium' : ''}>{label}</span>
              </button>
            );
          }
        )}
      </div>

      {totalReports !== undefined && (
        <p className="text-xs text-muted-foreground">
          Mostrando {totalReports} denúncia{totalReports !== 1 ? 's' : ''} no mapa
        </p>
      )}
    </div>
  );
}
