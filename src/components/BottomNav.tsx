import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/home', icon: Home, label: 'Início' },
  { path: '/nova-denuncia', icon: PlusCircle, label: 'Denunciar' },
  { path: '/denuncias', icon: List, label: 'Denúncias' },
  { path: '/orgaos', icon: Building2, label: 'Órgãos' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-4 min-w-[64px] transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
