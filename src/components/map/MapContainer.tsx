import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export function MapComponent({ center, zoom, markers, onMarkerClick, className }: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />
      
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createCustomIcon(getCategoryColor(marker.category, marker.facilityType))}
          eventHandlers={{
            click: () => onMarkerClick?.(marker),
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-semibold text-sm">{marker.title}</h3>
              {marker.description && (
                <p className="text-xs text-gray-600 mt-1">{marker.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMapContainer>
  );
}
