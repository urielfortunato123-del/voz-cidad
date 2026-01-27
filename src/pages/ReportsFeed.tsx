import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ReportCard } from '@/components/ReportCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReports } from '@/hooks/useReports';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';

export default function ReportsFeed() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { data: reports, isLoading } = useReports(
    location?.uf || null,
    location?.city || null,
    categoryFilter !== 'all' ? categoryFilter as CategoryKey : null
  );
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title="Denúncias"
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
        
        {/* Reports List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              Nenhuma denúncia encontrada
            </p>
            <Button onClick={() => navigate('/nova-denuncia')}>
              Criar primeira denúncia
            </Button>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
