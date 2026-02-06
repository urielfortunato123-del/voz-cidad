import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.92 }}
              className={cn(
                'relative flex flex-col items-center gap-1 py-3 px-4 min-w-[64px] transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
              </motion.div>
              <span className="text-xs font-medium">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}