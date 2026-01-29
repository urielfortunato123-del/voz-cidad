import { createContext, useContext, ReactNode } from 'react';
import { useOfflineQueue, PendingReport } from '@/hooks/useOfflineQueue';

interface OfflineContextValue {
  pendingReports: PendingReport[];
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  addPendingReport: (
    input: Omit<PendingReport, 'id' | 'protocol' | 'created_at' | 'syncAttempts' | 'lastSyncAttempt'>,
    files?: File[]
  ) => Promise<PendingReport>;
  removePendingReport: (id: string) => void;
  syncPendingReports: () => Promise<void>;
  retrySync: () => void;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const offlineQueue = useOfflineQueue();

  return (
    <OfflineContext.Provider value={offlineQueue}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
