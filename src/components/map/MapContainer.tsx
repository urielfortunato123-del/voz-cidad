import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CategoryKey } from '@/lib/constants';

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
}

interface MapContainerProps {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onViewportChange?: (viewport: {
    center: [number, number];
    zoom: number;
    bbox: [number, number, number, number];
  }) => void;
  className?: string;
}

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
  onMarkerClick,
  onViewportChange,
  className,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

    const map = L.map(mapContainerRef.current).setView(center, zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
    };
  }, []);

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
      
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(`
          <div style="padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0;">${marker.title}</h3>
            ${marker.description ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">${marker.description}</p>` : ''}
          </div>
        `);
      
      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }
      
      markersLayerRef.current?.addLayer(leafletMarker);
    });
  }, [markers, onMarkerClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className={className}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    />
  );
}
