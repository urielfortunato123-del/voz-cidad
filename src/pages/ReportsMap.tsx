import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Loader2, MapPin, Search, Navigation } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CategoryTag } from '@/components/CategoryTag';
import { MapComponent, type MapMarker } from '@/components/map/MapContainer';
import { FacilityLegend, FACILITY_TYPES } from '@/components/map/FacilityLegend';
import { useBrazilFacilities } from '@/hooks/useBrazilFacilities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';

// Brazil center coordinates
const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];
const BRAZIL_ZOOM = 4;

const MIN_ZOOM_FOR_FACILITIES = 10;

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
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(BRAZIL_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(BRAZIL_ZOOM);
  const [mapBbox, setMapBbox] = useState<[number, number, number, number] | null>(null);

  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [facilityErrorHint, setFacilityErrorHint] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    FACILITY_TYPES.map(f => f.key)
  );
  const [showReports, setShowReports] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Auto-detect user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(14);
          setIsLocating(false);
        },
        (err) => {
          console.log('Geolocation error:', err.message);
          setLocationError('Não foi possível obter sua localização. Use a busca.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocalização não suportada neste navegador.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapZoom(14);
        setIsLocating(false);
        setFacilityErrorHint(null);
      },
      (err) => {
        setLocationError('Não foi possível obter sua localização.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch reports with location
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['map-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, description, category, lat, lng, created_at')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(500);
      
      if (error) throw error;
      return (data || []) as ReportWithLocation[];
    },
  });
  
  // Fetch facilities from OpenStreetMap
  const facilitiesEnabled = !!mapBbox && mapZoom >= MIN_ZOOM_FOR_FACILITIES;
  const {
    data: facilities,
    isLoading: isLoadingFacilities,
    error: facilitiesError,
  } = useBrazilFacilities(mapBbox, activeFilters, facilitiesEnabled);
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  const handleFilterToggle = useCallback((key: string) => {
    setActiveFilters(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  }, []);
  
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
  }, []);

  const handleViewportChange = useCallback(
    (viewport: { center: [number, number]; zoom: number; bbox: [number, number, number, number] }) => {
      setMapBbox(viewport.bbox);
      setMapZoom(viewport.zoom);
      // don't constantly overwrite center while the user pans slightly; keep it for search
    },
    []
  );

  const handleSearch = useCallback(async () => {
    const q = searchText.trim();
    if (!q) return;
    setIsSearching(true);
    setFacilityErrorHint(null);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', q);
      url.searchParams.set('countrycodes', 'br');
      url.searchParams.set('limit', '1');

      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR',
        },
      });

      if (!res.ok) throw new Error('Não foi possível buscar esse endereço.');
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data?.length) {
        throw new Error('Nenhum resultado encontrado. Tente “Cidade/UF” ou um bairro.');
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Resultado inválido.');
      setMapCenter([lat, lng]);
      setMapZoom(13);
    } catch (e) {
      setFacilityErrorHint(e instanceof Error ? e.message : 'Erro ao buscar endereço.');
    } finally {
      setIsSearching(false);
    }
  }, [searchText]);
  
  // Combine reports and facilities into markers
  const allMarkers = useMemo(() => {
    const markers: MapMarker[] = [];
    
    // Add report markers
    if (showReports && reports) {
      reports.forEach(report => {
        markers.push({
          id: `report-${report.id}`,
          lat: report.lat,
          lng: report.lng,
          title: report.title || report.description.substring(0, 50) + '...',
          description: new Date(report.created_at).toLocaleDateString('pt-BR'),
          category: report.category,
          type: 'report',
        });
      });
    }
    
    // Add facility markers
    if (facilities) {
      markers.push(...facilities.filter(f => activeFilters.includes(f.facilityType || '')));
    }
    
    return markers;
  }, [reports, facilities, activeFilters, showReports]);
  
  const isLoading = isLoadingReports || isLoadingFacilities;
  
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
        title="Mapa do Brasil"
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container">
        <div className="space-y-4">
          {/* Search */}
          <Card className="card-elevated">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar cidade, bairro ou endereço"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <Button onClick={handleSearch} disabled={isSearching} size="icon">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
                <Button onClick={handleLocateMe} disabled={isLocating} variant="outline" size="icon" title="Minha localização">
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isLocating 
                  ? 'Obtendo sua localização...' 
                  : `Dica: aproxime o zoom (nível ${MIN_ZOOM_FOR_FACILITIES}+) para ver UPAs/UBS/Hospitais/Escolas.`}
              </p>
              {(facilityErrorHint || facilitiesError || locationError) && (
                <p className="text-xs text-destructive mt-2">
                  {locationError || facilityErrorHint || (facilitiesError instanceof Error ? facilitiesError.message : 'Erro ao carregar locais.')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Facility Filters */}
          <FacilityLegend 
            activeFilters={activeFilters} 
            onFilterToggle={handleFilterToggle} 
          />
          
          {/* Report toggle */}
          <Card className="card-elevated">
            <CardContent className="p-3">
              <button
                onClick={() => setShowReports(!showReports)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all w-full justify-center ${
                  showReports 
                    ? 'bg-primary/10 ring-1 ring-primary' 
                    : 'bg-muted/50 opacity-60 hover:opacity-100'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>Mostrar Denúncias ({reports?.length || 0})</span>
              </button>
            </CardContent>
          </Card>
          
          {/* Category Legend for Reports */}
          {showReports && (
            <Card className="card-elevated">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-sm">Categorias de Denúncias</h3>
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
          )}
          
          {/* Map */}
          <Card className="card-elevated overflow-hidden">
            <div className="relative h-[50vh] min-h-[400px]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando mapa...</span>
                  </div>
                </div>
              )}
              <MapComponent
                center={mapCenter}
                zoom={mapZoom}
                markers={allMarkers}
                onMarkerClick={handleMarkerClick}
                onViewportChange={handleViewportChange}
              />
            </div>
          </Card>
          
          {/* Selected Marker Info */}
          {selectedMarker && (
            <Card className="card-elevated animate-in fade-in slide-in-from-bottom-4">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  {selectedMarker.type === 'report' && selectedMarker.category ? (
                    <CategoryTag category={selectedMarker.category} />
                  ) : (
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary font-medium">
                      {getFacilityLabel(selectedMarker.facilityType || '')}
                    </span>
                  )}
                  {selectedMarker.type === 'report' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/denuncia/${selectedMarker.id.replace('report-', '')}`)}
                    >
                      Ver detalhes
                    </Button>
                  )}
                </div>
                <p className="text-sm font-medium">{selectedMarker.title}</p>
                {selectedMarker.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMarker.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Stats */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              {allMarkers.length} marcadores no mapa
              {reports?.length ? ` • ${reports.length} denúncias` : ''}
              {facilities?.length ? ` • ${facilities.length} estabelecimentos` : ''}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/denuncias')}
          >
            <List className="mr-2 h-4 w-4" />
            Ver lista de denúncias
          </Button>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}

function getFacilityLabel(type: string): string {
  const labels: Record<string, string> = {
    hospital: 'Hospital',
    upa: 'UPA',
    ubs: 'UBS',
    escola_municipal: 'Escola Municipal',
    escola_estadual: 'Escola Estadual',
    prefeitura: 'Prefeitura',
    camara: 'Câmara Municipal',
  };
  return labels[type] || 'Estabelecimento';
}
