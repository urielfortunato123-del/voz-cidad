import { useSwipeBack } from '@/hooks/useSwipeBack';

interface SwipeBackProviderProps {
  children: React.ReactNode;
}

export function SwipeBackProvider({ children }: SwipeBackProviderProps) {
  // Initialize swipe back gesture handling
  useSwipeBack({
    threshold: 80,
    velocityThreshold: 0.3,
    edgeZone: 30,
    excludeRoutes: ['/home', '/', '/selecionar-local', '/onboarding'],
  });

  return <>{children}</>;
}
