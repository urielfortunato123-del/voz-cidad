import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateProtocol } from '@/lib/protocol';
import { getDeviceId } from '@/lib/device';
import { toast } from 'sonner';
import type { CategoryKey } from '@/lib/constants';

export interface PendingReport {
  id: string;
  protocol: string;
  uf: string;
  city: string;
  category: CategoryKey;
  title: string | null;
  description: string;
  occurred_at: string;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  is_anonymous: boolean;
  author_name: string | null;
  author_contact: string | null;
  show_name_publicly: boolean;
  created_at: string;
  files?: { name: string; type: string; data: string }[]; // base64 for offline storage
  syncAttempts: number;
  lastSyncAttempt: string | null;
}

const STORAGE_KEY = 'vozdacidade_pending_reports';
const MAX_SYNC_ATTEMPTS = 5;

function getPendingReports(): PendingReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePendingReports(reports: PendingReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function useOfflineQueue() {
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load pending reports on mount
  useEffect(() => {
    setPendingReports(getPendingReports());
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida! Sincronizando...', { 
        icon: '🌐',
        duration: 3000 
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline. Denúncias serão salvas localmente.', {
        icon: '📴',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingReports.length > 0 && !isSyncing) {
      syncPendingReports();
    }
  }, [isOnline]);

  const addPendingReport = useCallback(async (
    input: Omit<PendingReport, 'id' | 'protocol' | 'created_at' | 'syncAttempts' | 'lastSyncAttempt'>,
    files: File[] = []
  ): Promise<PendingReport> => {
    const protocol = generateProtocol();
    const id = crypto.randomUUID();
    
    // Convert files to base64 for offline storage
    const filePromises = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return {
        name: file.name,
        type: file.type,
        data: base64,
      };
    });
    
    const fileData = await Promise.all(filePromises);
    
    const pendingReport: PendingReport = {
      ...input,
      id,
      protocol,
      created_at: new Date().toISOString(),
      files: fileData,
      syncAttempts: 0,
      lastSyncAttempt: null,
    };
    
    const updated = [...pendingReports, pendingReport];
    setPendingReports(updated);
    savePendingReports(updated);
    
    toast.success('Denúncia salva localmente!', {
      description: `Protocolo: ${protocol}. Será enviada quando houver conexão.`,
      icon: '💾',
      duration: 5000
    });
    
    return pendingReport;
  }, [pendingReports]);

  const removePendingReport = useCallback((id: string) => {
    const updated = pendingReports.filter(r => r.id !== id);
    setPendingReports(updated);
    savePendingReports(updated);
  }, [pendingReports]);

  const syncSingleReport = async (report: PendingReport): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      
      // Insert the report
      const { data: createdReport, error } = await supabase
        .from('reports')
        .insert({
          protocol: report.protocol,
          device_id: deviceId,
          uf: report.uf,
          city: report.city,
          category: report.category,
          title: report.title,
          description: report.description,
          occurred_at: report.occurred_at,
          address_text: report.address_text,
          lat: report.lat,
          lng: report.lng,
          is_anonymous: report.is_anonymous,
          author_name: report.author_name,
          author_contact: report.author_contact,
          show_name_publicly: report.show_name_publicly,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Upload files if any
      if (report.files && report.files.length > 0) {
        for (const file of report.files) {
          try {
            // Convert base64 back to blob
            const byteCharacters = atob(file.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: file.type });
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${createdReport.id}/${crypto.randomUUID()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('evidences')
              .upload(fileName, blob);
            
            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              continue;
            }
            
            const { data: urlData } = supabase.storage
              .from('evidences')
              .getPublicUrl(fileName);
            
            await supabase
              .from('evidences')
              .insert({
                report_id: createdReport.id,
                file_url: urlData.publicUrl,
                file_type: file.type,
                file_name: file.name,
              });
          } catch (fileError) {
            console.error('Error processing file:', fileError);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing report:', error);
      return false;
    }
  };

  const syncPendingReports = useCallback(async () => {
    if (isSyncing || !isOnline || pendingReports.length === 0) return;
    
    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;
    
    const updatedReports: PendingReport[] = [];
    
    for (const report of pendingReports) {
      if (report.syncAttempts >= MAX_SYNC_ATTEMPTS) {
        // Keep failed reports but don't retry
        updatedReports.push(report);
        failCount++;
        continue;
      }
      
      const success = await syncSingleReport(report);
      
      if (success) {
        successCount++;
        // Don't add to updatedReports - it's been synced
      } else {
        // Update sync attempt count
        updatedReports.push({
          ...report,
          syncAttempts: report.syncAttempts + 1,
          lastSyncAttempt: new Date().toISOString(),
        });
        failCount++;
      }
    }
    
    setPendingReports(updatedReports);
    savePendingReports(updatedReports);
    setIsSyncing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} denúncia(s) sincronizada(s)!`, {
        icon: '✅',
        duration: 4000
      });
    }
    
    if (failCount > 0 && successCount === 0) {
      toast.error(`Falha ao sincronizar ${failCount} denúncia(s)`, {
        description: 'Tentaremos novamente em breve.',
        icon: '⚠️'
      });
    }
  }, [isSyncing, isOnline, pendingReports]);

  const retrySync = useCallback(() => {
    if (isOnline && !isSyncing) {
      syncPendingReports();
    } else if (!isOnline) {
      toast.error('Sem conexão com a internet');
    }
  }, [isOnline, isSyncing, syncPendingReports]);

  return {
    pendingReports,
    pendingCount: pendingReports.length,
    isOnline,
    isSyncing,
    addPendingReport,
    removePendingReport,
    syncPendingReports,
    retrySync,
  };
}
