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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-colors min-w-[72px]',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="bottomNavBg"
                    className="absolute inset-0 bg-primary/15 rounded-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative z-10"
              >
                <Icon className={cn('h-6 w-6', isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]')} />
              </motion.div>
              <span className={cn(
                'text-xs font-semibold relative z-10',
                isActive && 'text-primary'
              )}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}