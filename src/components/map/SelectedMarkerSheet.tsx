import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CategoryTag } from '@/components/CategoryTag';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { MapMarker } from './MapContainer';
import { formatDistance } from './MapContainer';

const FACILITY_LABELS: Record<string, string> = {
  hospital: 'Hospital',
  upa: 'UPA',
  ubs: 'UBS',
  escola_municipal: 'Escola Municipal',
  escola_estadual: 'Escola Estadual',
  prefeitura: 'Prefeitura',
  camara: 'Câmara Municipal',
};

interface SelectedMarkerSheetProps {
  marker: MapMarker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectedMarkerSheet({ marker, open, onOpenChange }: SelectedMarkerSheetProps) {
  const navigate = useNavigate();

  if (!marker) return null;

  const isReport = marker.type === 'report';
  const facilityLabel = FACILITY_LABELS[marker.facilityType || ''] || 'Estabelecimento';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            {isReport && marker.category ? (
              <CategoryTag category={marker.category} />
            ) : (
              <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary font-medium">
                {facilityLabel}
              </span>
            )}
            {isReport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/denuncia/${marker.id.replace('report-', '')}`);
                }}
              >
                Ver detalhes
              </Button>
            )}
          </div>
          <DrawerTitle className="text-left mt-2">{marker.title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {marker.description && (
            <p className="text-sm text-muted-foreground">{marker.description}</p>
          )}

          {marker.distance !== undefined && (
            <p className="text-sm text-primary font-medium">
              📍 Distância: {formatDistance(marker.distance)}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const url = `https://waze.com/ul?ll=${marker.lat},${marker.lng}&navigate=yes`;
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Waze
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
