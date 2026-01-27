import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLocation?: { uf: string; city: string } | null;
  onLocationClick?: () => void;
  showThemeToggle?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function Header({ 
  title = APP_NAME, 
  showBack = false, 
  showLocation,
  onLocationClick,
  showThemeToggle = true,
  rightContent,
  className 
}: HeaderProps) {
  const navigate = useNavigate();
  
  return (
    <header className={cn('sticky top-0 z-50 bg-card border-b border-border px-4 py-3 safe-area-top', className)}>
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="flex-shrink-0 -ml-2 h-10 w-10 hover:bg-muted"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
          )}
          
          <h1 className="font-heading font-semibold text-lg text-foreground truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {showLocation && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLocationClick}
              className="text-muted-foreground"
            >
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate max-w-[100px]">{showLocation.city}</span>
            </Button>
          )}
          {showThemeToggle && <ThemeToggle />}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
