import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, List, Loader2, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryTag } from '@/components/CategoryTag';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';

interface ReportWithLocation {
  id: string;
  title: string | null;
  description: string;
  category: CategoryKey;
  lat: number;
  lng: number;
  created_at: string;
}

export default function ReportsMap() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  const [selectedReport, setSelectedReport] = useState<ReportWithLocation | null>(null);
  
  const { data: reports, isLoading } = useQuery({
    queryKey: ['map-reports', location?.uf, location?.city],
    queryFn: async () => {
      if (!location) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, description, category, lat, lng, created_at')
        .eq('uf', location.uf)
        .eq('city', location.city)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      
      if (error) throw error;
      return (data || []) as ReportWithLocation[];
    },
    enabled: !!location,
  });
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  // Group reports by approximate location for display
  const getCategoryColor = (category: CategoryKey) => {
    const colors: Record<string, string> = {
      SAUDE: '#E91E63',
      OBRAS: '#FF9800',
      EDUCACAO: '#2196F3',
      SERVICOS_URBANOS: '#26A69A',
      MEIO_AMBIENTE: '#4CAF50',
      SEGURANCA: '#9C27B0',
      CORRUPCAO: '#F44336',
    };
    return colors[category] || '#666';
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title="Mapa de Denúncias"
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {/* Map Legend */}
            <Card className="card-elevated">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Legenda</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(key as CategoryKey) }}
                      />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Simple Map Visualization */}
            <Card className="card-elevated overflow-hidden">
              <div className="relative bg-muted aspect-square">
                {/* Grid background */}
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border border-border/30" />
                  ))}
                </div>
                
                {/* Report pins */}
                {reports.map((report) => {
                  // Normalize lat/lng to grid position (simplified)
                  // This is a simplified visualization - in production, use a real map library
                  const minLat = Math.min(...reports.map(r => r.lat));
                  const maxLat = Math.max(...reports.map(r => r.lat));
                  const minLng = Math.min(...reports.map(r => r.lng));
                  const maxLng = Math.max(...reports.map(r => r.lng));
                  
                  const latRange = maxLat - minLat || 1;
                  const lngRange = maxLng - minLng || 1;
                  
                  const x = ((report.lng - minLng) / lngRange) * 90 + 5;
                  const y = ((maxLat - report.lat) / latRange) * 90 + 5;
                  
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="absolute transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-125 z-10"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <MapPin 
                        className="h-6 w-6 drop-shadow-md"
                        style={{ color: getCategoryColor(report.category) }}
                        fill={getCategoryColor(report.category)}
                      />
                    </button>
                  );
                })}
                
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-muted-foreground/50 text-sm">
                    {location.city}/{location.uf}
                  </span>
                </div>
              </div>
            </Card>
            
            {/* Selected Report Card */}
            {selectedReport && (
              <Card className="card-elevated animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <CategoryTag category={selectedReport.category} />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/denuncia/${selectedReport.id}`)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                  <p className="text-sm font-medium">
                    {selectedReport.title || selectedReport.description.substring(0, 60) + '...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedReport.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Summary */}
            <p className="text-center text-sm text-muted-foreground">
              {reports.length} denúncia{reports.length !== 1 ? 's' : ''} com localização
            </p>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/denuncias')}
            >
              <List className="mr-2 h-4 w-4" />
              Ver lista completa
            </Button>
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma denúncia com localização
            </p>
            <p className="text-sm text-muted-foreground">
              As denúncias aparecerão aqui quando tiverem coordenadas GPS
            </p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
