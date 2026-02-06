import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PendingReportsIndicator } from '@/components/PendingReportsIndicator';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useOffline } from '@/contexts/OfflineContext';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLocation?: { uf: string; city: string } | null;
  onLocationClick?: () => void;
  showThemeToggle?: boolean;
  showOfflineIndicator?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function Header({ 
  title = APP_NAME, 
  showBack = false, 
  showLocation,
  onLocationClick,
  showThemeToggle = true,
  showOfflineIndicator = true,
  rightContent,
  className 
}: HeaderProps) {
  const navigate = useNavigate();
  const { 
    pendingReports, 
    isOnline, 
    isSyncing, 
    retrySync, 
    removePendingReport 
  } = useOffline();
  
  return (
    <>
      {showOfflineIndicator && (
        <OfflineBanner
          pendingCount={pendingReports.length}
          isOnline={isOnline}
          isSyncing={isSyncing}
          onRetrySync={retrySync}
        />
      )}
      <header className={cn(
        'sticky top-0 z-40 glass-strong border-b border-border/30 px-4 py-4 safe-area-top',
        (!isOnline || pendingReports.length > 0) && showOfflineIndicator && 'mt-10',
        className
      )}>
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  className="flex-shrink-0 -ml-2 h-10 w-10 hover:bg-primary/10 rounded-xl"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
              </motion.div>
            )}
            
            {!showBack && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl"
              >
                <img src={logo} alt="Fiscaliza Brasil" className="h-7 w-7 object-contain" />
              </motion.div>
            )}
            
            <h1 className="font-bold text-lg text-foreground truncate">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {showLocation && (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLocationClick}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                >
                  <MapPin className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="truncate max-w-[100px] font-medium">{showLocation.city}</span>
                </Button>
              </motion.div>
            )}
            {showOfflineIndicator && pendingReports.length > 0 && (
              <PendingReportsIndicator
                pendingReports={pendingReports}
                isSyncing={isSyncing}
                isOnline={isOnline}
                onRetrySync={retrySync}
                onRemoveReport={removePendingReport}
              />
            )}
            {showThemeToggle && <ThemeToggle />}
            {rightContent}
          </div>
        </div>
      </header>
    </>
  );
}
