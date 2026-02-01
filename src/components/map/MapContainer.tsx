import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CategoryKey } from '@/lib/constants';

// Map tile layers
const MAP_LAYERS = {
  street: {
    name: 'Ruas',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    name: 'Terreno',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    name: 'Escuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
} as const;

type MapLayerKey = keyof typeof MAP_LAYERS;

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  category?: CategoryKey;
  type?: 'report' | 'facility';
  facilityType?: string;
  distance?: number; // distance in km from user
}

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

interface MapContainerProps {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  userLocation?: [number, number] | null;
  onMarkerClick?: (marker: MapMarker) => void;
  onViewportChange?: (viewport: {
    center: [number, number];
    zoom: number;
    bbox: [number, number, number, number];
  }) => void;
  onMapClick?: (latlng: [number, number]) => void;
  className?: string;
}

// Special icon for user location
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Custom marker icons by category/type
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const getCategoryColor = (category?: CategoryKey, facilityType?: string): string => {
  if (facilityType) {
    const facilityColors: Record<string, string> = {
      'hospital': '#E91E63',
      'upa': '#F44336',
      'ubs': '#FF5722',
      'escola_municipal': '#2196F3',
      'escola_estadual': '#3F51B5',
      'prefeitura': '#9C27B0',
      'camara': '#673AB7',
    };
    return facilityColors[facilityType] || '#666';
  }
  
  const colors: Record<string, string> = {
    SAUDE: '#E91E63',
    OBRAS: '#FF9800',
    EDUCACAO: '#2196F3',
    SERVICOS_URBANOS: '#26A69A',
    MEIO_AMBIENTE: '#4CAF50',
    SEGURANCA: '#9C27B0',
    CORRUPCAO: '#F44336',
  };
  return colors[category || ''] || '#666';
};

export function MapComponent({
  center,
  zoom,
  markers,
  userLocation,
  onMarkerClick,
  onViewportChange,
  onMapClick,
  className,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>('street');

  const emitViewport = () => {
    const map = mapRef.current;
    if (!map || !onViewportChange) return;
    const b = map.getBounds();
    const c = map.getCenter();
    onViewportChange({
      center: [c.lat, c.lng],
      zoom: map.getZoom(),
      bbox: [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
    }).setView(center, zoom);
    
    const layer = MAP_LAYERS[activeLayer];
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Emit initial viewport and on interactions
    emitViewport();
    map.on('moveend', emitViewport);
    map.on('zoomend', emitViewport);

    return () => {
      map.off('moveend', emitViewport);
      map.off('zoomend', emitViewport);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update tile layer when activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;

    const layer = MAP_LAYERS[activeLayer];
    map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution
    }).addTo(map);
    
    // Move tile layer to back
    tileLayerRef.current.bringToBack();
  }, [activeLayer]);

  // Handle map click for manual location setting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMapClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // Update center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
      emitViewport();
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const icon = createCustomIcon(getCategoryColor(marker.category, marker.facilityType));
      
      const distanceText = marker.distance !== undefined 
        ? `<p style="font-size: 11px; color: #3B82F6; margin: 4px 0 0 0; font-weight: 500;">📍 ${formatDistance(marker.distance)}</p>`
        : '';
      
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(`
          <div style="padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0;">${marker.title}</h3>
            ${marker.description ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">${marker.description}</p>` : ''}
            ${distanceText}
          </div>
        `);
      
      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }
      
      markersLayerRef.current?.addLayer(leafletMarker);
    });
  }, [markers, onMarkerClick]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Add new user marker if location available
    if (userLocation) {
      const userIcon = createUserLocationIcon();
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="padding: 8px; text-align: center;">
            <strong style="font-size: 14px; color: #3B82F6;">📍 Você está aqui</strong>
          </div>
        `)
        .addTo(map);
    }
  }, [userLocation]);

  return (
    <div className="relative h-full w-full">
      {/* Layer Control */}
      <div className="absolute top-2 right-2 z-[1000]">
        <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="px-2 py-1.5 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Camadas</span>
          </div>
          <div className="p-1 flex flex-col gap-0.5">
            {(Object.keys(MAP_LAYERS) as MapLayerKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className={`px-3 py-1.5 text-xs rounded transition-colors text-left min-w-[80px] ${
                  activeLayer === key
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {MAP_LAYERS[key].name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className={className}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      />
    </div>
  );
}
