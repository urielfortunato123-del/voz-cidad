import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Loader2, MapPin, Search, Navigation, MousePointer } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapComponent, calculateDistance, type MapMarker, type MapLayerKey } from '@/components/map/MapContainer';
import { FacilityLegend, FACILITY_TYPES } from '@/components/map/FacilityLegend';
import { ReportCategoryFilter } from '@/components/map/ReportCategoryFilter';
import { SelectedMarkerSheet } from '@/components/map/SelectedMarkerSheet';
import { useBrazilFacilities } from '@/hooks/useBrazilFacilities';
import { useMapPreferences } from '@/hooks/useMapPreferences';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';

// Brazil center coordinates
const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];
const BRAZIL_ZOOM = 4;
const MIN_ZOOM_FOR_FACILITIES = 10;
const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50, 0];

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
  
  // Use persisted preferences
  const {
    preferences,
    updatePreference,
    toggleCategory,
    toggleFacilityFilter,
  } = useMapPreferences();
  
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    preferences.lastCenter ?? BRAZIL_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(preferences.lastZoom ?? BRAZIL_ZOOM);
  const [mapBbox, setMapBbox] = useState<[number, number, number, number] | null>(null);

  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [facilityErrorHint, setFacilityErrorHint] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isManualLocationMode, setIsManualLocationMode] = useState(false);
  const [debouncedBbox, setDebouncedBbox] = useState<[number, number, number, number] | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [flyToTrigger, setFlyToTrigger] = useState(0);

  // Auto-detect user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setUserLocation(coords);
          setMapZoom(14);
          setFlyToTrigger((prev) => prev + 1);
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
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        setUserLocation(coords);
        setMapZoom(14);
        setFlyToTrigger((prev) => prev + 1);
        setIsLocating(false);
        setFacilityErrorHint(null);
      },
      () => {
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

  // Fetch facilities from OpenStreetMap with debounced bbox
  const facilitiesEnabled = !!debouncedBbox && mapZoom >= MIN_ZOOM_FOR_FACILITIES;
  const {
    data: facilities,
    isLoading: isLoadingFacilities,
    error: facilitiesError,
  } = useBrazilFacilities(debouncedBbox, preferences.activeFacilityFilters, facilitiesEnabled);

  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    setSheetOpen(true);
  }, []);

  const handleViewportChange = useCallback(
    (viewport: { center: [number, number]; zoom: number; bbox: [number, number, number, number] }) => {
      setMapBbox(viewport.bbox);
      setMapZoom(viewport.zoom);

      // Debounce the bbox update for facilities fetching
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedBbox(viewport.bbox);
      }, 500);
    },
    []
  );

  const handleMapClick = useCallback(
    (latlng: [number, number]) => {
      if (isManualLocationMode) {
        setUserLocation(latlng);
        setIsManualLocationMode(false);
        setLocationError(null);
      }
    },
    [isManualLocationMode]
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
          Accept: 'application/json',
          'Accept-Language': 'pt-BR',
        },
      });

      if (!res.ok) throw new Error('Não foi possível buscar esse endereço.');
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data?.length) {
        throw new Error('Nenhum resultado encontrado. Tente "Cidade/UF" ou um bairro.');
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Resultado inválido.');
      setMapCenter([lat, lng]);
      setMapZoom(13);
      setFlyToTrigger((prev) => prev + 1);
    } catch (e) {
      setFacilityErrorHint(e instanceof Error ? e.message : 'Erro ao buscar endereço.');
    } finally {
      setIsSearching(false);
    }
  }, [searchText]);

  // Filter reports by active categories
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => preferences.activeCategories.includes(r.category));
  }, [reports, preferences.activeCategories]);

  // Combine reports and facilities into markers with distance
  const allMarkers = useMemo(() => {
    const markers: MapMarker[] = [];

    // Add report markers
    if (preferences.showReports && filteredReports) {
      filteredReports.forEach((report) => {
        const distance = userLocation
          ? calculateDistance(userLocation[0], userLocation[1], report.lat, report.lng)
          : undefined;

        // Apply radius filter
        if (
          preferences.radiusFilter > 0 &&
          userLocation &&
          (distance === undefined || distance > preferences.radiusFilter)
        ) {
          return;
        }

        markers.push({
          id: `report-${report.id}`,
          lat: report.lat,
          lng: report.lng,
          title: report.title || report.description.substring(0, 50) + '...',
          description: new Date(report.created_at).toLocaleDateString('pt-BR'),
          category: report.category,
          type: 'report',
          distance,
        });
      });
    }

    // Add facility markers with distance
    if (facilities) {
      const filteredFacilities = facilities
        .filter((f) => preferences.activeFacilityFilters.includes(f.facilityType || ''))
        .map((f) => ({
          ...f,
          distance: userLocation
            ? calculateDistance(userLocation[0], userLocation[1], f.lat, f.lng)
            : undefined,
        }))
        .filter((f) => {
          if (
            preferences.radiusFilter > 0 &&
            userLocation &&
            (f.distance === undefined || f.distance > preferences.radiusFilter)
          ) {
            return false;
          }
          return true;
        });
      markers.push(...filteredFacilities);
    }

    // Sort by distance if user location is available
    if (userLocation) {
      markers.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return markers;
  }, [filteredReports, facilities, preferences, userLocation]);

  // Count markers within each radius option for display
  const markersWithinRadius = useMemo(() => {
    if (!userLocation) return null;

    const allWithDistance = [
      ...(preferences.showReports && filteredReports
        ? filteredReports.map((r) => ({
            distance: calculateDistance(userLocation[0], userLocation[1], r.lat, r.lng),
          }))
        : []),
      ...(facilities
        ? facilities
            .filter((f) => preferences.activeFacilityFilters.includes(f.facilityType || ''))
            .map((f) => ({
              distance: calculateDistance(userLocation[0], userLocation[1], f.lat, f.lng),
            }))
        : []),
    ];

    return RADIUS_OPTIONS.reduce(
      (acc, radius) => {
        acc[radius] =
          radius === 0 ? allWithDistance.length : allWithDistance.filter((m) => m.distance <= radius).length;
        return acc;
      },
      {} as Record<number, number>
    );
  }, [userLocation, filteredReports, facilities, preferences]);

  const isLoading = isLoadingReports || isLoadingFacilities;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Mapa do Brasil" showLocation={location} onLocationClick={handleChangeLocation} />

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
                <Button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  variant="outline"
                  size="icon"
                  title="Minha localização (GPS)"
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setIsManualLocationMode(!isManualLocationMode)}
                  variant={isManualLocationMode ? 'default' : 'outline'}
                  size="icon"
                  title="Definir localização no mapa"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isLocating
                  ? 'Obtendo sua localização...'
                  : isManualLocationMode
                    ? '👆 Clique no mapa para definir sua localização'
                    : `Dica: aproxime o zoom (nível ${MIN_ZOOM_FOR_FACILITIES}+) para ver UPAs/UBS/Hospitais/Escolas.`}
              </p>
              {(facilityErrorHint || facilitiesError || locationError) && (
                <p className="text-xs text-destructive mt-2">
                  {locationError ||
                    facilityErrorHint ||
                    (facilitiesError instanceof Error ? facilitiesError.message : 'Erro ao carregar locais.')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Radius Filter */}
          {userLocation && (
            <Card className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Filtrar por distância</h3>
                  <span className="text-xs text-primary font-medium">
                    {preferences.radiusFilter === 0 ? 'Sem limite' : `Até ${preferences.radiusFilter} km`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {RADIUS_OPTIONS.map((radius) => (
                    <button
                      key={radius}
                      onClick={() => updatePreference('radiusFilter', radius)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        preferences.radiusFilter === radius
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {radius === 0 ? 'Todos' : `${radius} km`}
                      {markersWithinRadius && <span className="ml-1 opacity-70">({markersWithinRadius[radius]})</span>}
                    </button>
                  ))}
                </div>
                {preferences.radiusFilter > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Mostrando {allMarkers.length} locais em até {preferences.radiusFilter} km
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Facility Filters */}
          <FacilityLegend activeFilters={preferences.activeFacilityFilters} onFilterToggle={toggleFacilityFilter} />

          {/* Report toggle & category filter */}
          <Card className="card-elevated">
            <CardContent className="p-4 space-y-4">
              <button
                onClick={() => updatePreference('showReports', !preferences.showReports)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all w-full justify-center ${
                  preferences.showReports
                    ? 'bg-primary/10 ring-1 ring-primary'
                    : 'bg-muted/50 opacity-60 hover:opacity-100'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>Mostrar Denúncias ({filteredReports?.length || 0})</span>
              </button>

              {preferences.showReports && (
                <ReportCategoryFilter
                  activeCategories={preferences.activeCategories}
                  onCategoryToggle={toggleCategory}
                  totalReports={filteredReports?.length}
                />
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className={`card-elevated overflow-hidden ${isManualLocationMode ? 'ring-2 ring-primary' : ''}`}>
            <div className="relative h-[50vh] min-h-[400px]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando mapa...</span>
                  </div>
                </div>
              )}
              {isManualLocationMode && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                  👆 Clique para definir sua localização
                </div>
              )}
              <MapComponent
                center={mapCenter}
                zoom={mapZoom}
                markers={allMarkers}
                userLocation={userLocation}
                flyToTrigger={flyToTrigger}
                activeLayer={preferences.layer}
                enableClustering={true}
                onLayerChange={(layer) => updatePreference('layer', layer)}
                onMarkerClick={handleMarkerClick}
                onViewportChange={handleViewportChange}
                onMapClick={handleMapClick}
              />
            </div>
          </Card>

          {/* Stats */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              {allMarkers.length} marcadores no mapa
              {filteredReports?.length ? ` • ${filteredReports.length} denúncias` : ''}
              {facilities?.length ? ` • ${facilities.length} estabelecimentos` : ''}
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/denuncias')}>
            <List className="mr-2 h-4 w-4" />
            Ver lista de denúncias
          </Button>
        </div>
      </main>

      {/* Bottom sheet for selected marker (mobile-friendly) */}
      <SelectedMarkerSheet marker={selectedMarker} open={sheetOpen} onOpenChange={setSheetOpen} />

      <BottomNav />
    </div>
  );
}
