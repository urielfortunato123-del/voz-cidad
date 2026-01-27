import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AgencyCard } from '@/components/AgencyCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgencies, type Agency } from '@/hooks/useAgencies';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, AGENCY_SCOPES, type CategoryKey } from '@/lib/constants';
import { toast } from 'sonner';

export default function AgenciesList() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { data: agencies, isLoading } = useAgencies(
    location?.uf || null,
    location?.city || null,
    categoryFilter !== 'all' ? categoryFilter as CategoryKey : null
  );
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  const handleSelectAgency = (agency: Agency) => {
    // Copy email to clipboard
    navigator.clipboard.writeText(agency.email);
    toast.success('E-mail copiado: ' + agency.email);
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  // Group agencies by scope
  const groupedAgencies = agencies?.reduce((acc, agency) => {
    if (!acc[agency.scope]) {
      acc[agency.scope] = [];
    }
    acc[agency.scope].push(agency);
    return acc;
  }, {} as Record<string, Agency[]>);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title="Órgãos Públicos"
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container">
        {/* Filters */}
        <div className="mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="input-accessible">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Todas as categorias" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Agencies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : agencies && agencies.length > 0 ? (
          <div className="space-y-6">
            {(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'] as const).map((scope) => {
              const scopeAgencies = groupedAgencies?.[scope];
              if (!scopeAgencies?.length) return null;
              
              return (
                <div key={scope}>
                  <h3 className="section-header">{AGENCY_SCOPES[scope]}</h3>
                  <div className="space-y-3">
                    {scopeAgencies.map((agency) => (
                      <AgencyCard 
                        key={agency.id} 
                        agency={agency} 
                        onSelect={handleSelectAgency}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Nenhum órgão encontrado para esta localização
            </p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
