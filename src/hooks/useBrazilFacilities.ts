import { useQuery } from '@tanstack/react-query';
import type { MapMarker } from '@/components/map/MapContainer';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'addr:city'?: string;
    amenity?: string;
    healthcare?: string;
    'healthcare:speciality'?: string;
    operator?: string;
    'operator:type'?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Build Overpass QL query for facilities in a bounding box
function buildOverpassQuery(bbox: [number, number, number, number], facilityTypes: string[]): string {
  const [south, west, north, east] = bbox;
  const bboxStr = `${south},${west},${north},${east}`;
  
  const queries: string[] = [];
  
  facilityTypes.forEach(type => {
    switch (type) {
      case 'hospital':
        queries.push(`node["amenity"="hospital"](${bboxStr});`);
        queries.push(`way["amenity"="hospital"](${bboxStr});`);
        break;
      case 'upa':
        // UPAs are tagged as clinics with emergency in Brazil
        queries.push(`node["amenity"="clinic"]["healthcare"="emergency"](${bboxStr});`);
        queries.push(`way["amenity"="clinic"]["healthcare"="emergency"](${bboxStr});`);
        queries.push(`node["name"~"UPA|Unidade de Pronto",i](${bboxStr});`);
        queries.push(`way["name"~"UPA|Unidade de Pronto",i](${bboxStr});`);
        break;
      case 'ubs':
        // UBS are health posts/clinics
        queries.push(`node["amenity"="clinic"]["healthcare"="centre"](${bboxStr});`);
        queries.push(`way["amenity"="clinic"]["healthcare"="centre"](${bboxStr});`);
        queries.push(`node["name"~"UBS|Unidade Básica|Posto de Saúde",i](${bboxStr});`);
        queries.push(`way["name"~"UBS|Unidade Básica|Posto de Saúde",i](${bboxStr});`);
        break;
      case 'escola_municipal':
        queries.push(`node["amenity"="school"]["operator:type"="municipal"](${bboxStr});`);
        queries.push(`way["amenity"="school"]["operator:type"="municipal"](${bboxStr});`);
        queries.push(`node["amenity"="school"]["name"~"Municipal|E\\.M\\.",i](${bboxStr});`);
        queries.push(`way["amenity"="school"]["name"~"Municipal|E\\.M\\.",i](${bboxStr});`);
        break;
      case 'escola_estadual':
        queries.push(`node["amenity"="school"]["operator:type"="state"](${bboxStr});`);
        queries.push(`way["amenity"="school"]["operator:type"="state"](${bboxStr});`);
        queries.push(`node["amenity"="school"]["name"~"Estadual|E\\.E\\.",i](${bboxStr});`);
        queries.push(`way["amenity"="school"]["name"~"Estadual|E\\.E\\.",i](${bboxStr});`);
        break;
      case 'prefeitura':
        queries.push(`node["amenity"="townhall"](${bboxStr});`);
        queries.push(`way["amenity"="townhall"](${bboxStr});`);
        queries.push(`node["name"~"Prefeitura",i](${bboxStr});`);
        queries.push(`way["name"~"Prefeitura",i](${bboxStr});`);
        break;
      case 'camara':
        queries.push(`node["amenity"="townhall"]["name"~"Câmara",i](${bboxStr});`);
        queries.push(`way["amenity"="townhall"]["name"~"Câmara",i](${bboxStr});`);
        queries.push(`node["office"="government"]["name"~"Câmara",i](${bboxStr});`);
        queries.push(`way["office"="government"]["name"~"Câmara",i](${bboxStr});`);
        break;
    }
  });
  
  return `[out:json][timeout:25];(${queries.join('')});out center;`;
}

function determineFacilityType(element: OverpassElement): string {
  const name = element.tags?.name?.toLowerCase() || '';
  const amenity = element.tags?.amenity;
  const healthcare = element.tags?.healthcare;
  const operatorType = element.tags?.['operator:type'];
  
  // Check by name patterns first
  if (name.includes('upa') || name.includes('unidade de pronto')) return 'upa';
  if (name.includes('ubs') || name.includes('unidade básica') || name.includes('posto de saúde')) return 'ubs';
  if (name.includes('câmara')) return 'camara';
  if (name.includes('prefeitura')) return 'prefeitura';
  if (name.includes('e.m.') || (name.includes('municipal') && amenity === 'school')) return 'escola_municipal';
  if (name.includes('e.e.') || (name.includes('estadual') && amenity === 'school')) return 'escola_estadual';
  
  // Check by tags
  if (amenity === 'hospital') return 'hospital';
  if (healthcare === 'emergency') return 'upa';
  if (healthcare === 'centre' || (amenity === 'clinic' && !healthcare)) return 'ubs';
  if (amenity === 'townhall') return 'prefeitura';
  if (amenity === 'school') {
    if (operatorType === 'municipal') return 'escola_municipal';
    if (operatorType === 'state') return 'escola_estadual';
    return 'escola_municipal'; // Default to municipal
  }
  
  return 'hospital'; // Default fallback
}

export function useBrazilFacilities(
  bbox: [number, number, number, number] | null,
  facilityTypes: string[],
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['brazil-facilities', bbox, facilityTypes],
    queryFn: async (): Promise<MapMarker[]> => {
      if (!bbox || facilityTypes.length === 0) return [];
      
      const query = buildOverpassQuery(bbox, facilityTypes);
      
      const response = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch facilities from OpenStreetMap');
      }
      
      const data: OverpassResponse & { remark?: string } = await response.json();

      // Overpass sometimes returns 200 with a runtime error in `remark`
      if (data.remark && data.remark.toLowerCase().includes('timed out')) {
        throw new Error('Consulta grande demais: aproxime o zoom para carregar os locais.');
      }
      
      // Convert to MapMarker format
      const markers: MapMarker[] = data.elements
        .filter(el => (el.lat && el.lon) || el.center)
        .map(el => {
          const lat = el.lat || el.center?.lat || 0;
          const lng = el.lon || el.center?.lon || 0;
          const facilityType = determineFacilityType(el);
          
          return {
            id: `osm-${el.type}-${el.id}`,
            lat,
            lng,
            title: el.tags?.name || getFacilityLabel(facilityType),
            description: el.tags?.['addr:city'] || '',
            type: 'facility' as const,
            facilityType,
          };
        });
      
      // Remove duplicates by coordinates (rounded to 4 decimal places)
      const uniqueMarkers = markers.reduce((acc, marker) => {
        const key = `${marker.lat.toFixed(4)}-${marker.lng.toFixed(4)}`;
        if (!acc.has(key)) {
          acc.set(key, marker);
        }
        return acc;
      }, new Map<string, MapMarker>());
      
      return Array.from(uniqueMarkers.values());
    },
    enabled: enabled && !!bbox && facilityTypes.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 2,
  });
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
