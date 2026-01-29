import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CloudOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onRetrySync: () => void;
}

export function OfflineBanner({ 
  pendingCount, 
  isOnline, 
  isSyncing, 
  onRetrySync 
}: OfflineBannerProps) {
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show reconnected message briefly
  if (showReconnected && pendingCount === 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-success text-success-foreground py-2 px-4 flex items-center justify-center gap-2 animate-fade-in">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Conectado novamente!</span>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          Sem conexão — denúncias serão salvas localmente
        </span>
      </div>
    );
  }

  // Show pending sync banner
  if (pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-secondary text-secondary-foreground py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            {pendingCount} denúncia(s) pendente(s)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetrySync}
          disabled={isSyncing}
          className="h-7 px-2 text-xs"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sincronizar
            </>
          )}
        </Button>
      </div>
    );
  }

  return null;
}
