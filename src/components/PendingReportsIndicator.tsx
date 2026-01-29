import { CloudOff, RefreshCw, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORIES } from '@/lib/constants';
import type { PendingReport } from '@/hooks/useOfflineQueue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingReportsIndicatorProps {
  pendingReports: PendingReport[];
  isSyncing: boolean;
  isOnline: boolean;
  onRetrySync: () => void;
  onRemoveReport: (id: string) => void;
}

export function PendingReportsIndicator({
  pendingReports,
  isSyncing,
  isOnline,
  onRetrySync,
  onRemoveReport,
}: PendingReportsIndicatorProps) {
  if (pendingReports.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative gap-2 border-warning text-warning hover:bg-warning/10"
        >
          <CloudOff className="h-4 w-4" />
          <span className="hidden sm:inline">Pendentes</span>
          <Badge 
            variant="destructive" 
            className="h-5 min-w-5 px-1.5 text-xs absolute -top-2 -right-2"
          >
            {pendingReports.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-warning" />
            Denúncias Pendentes
          </SheetTitle>
          <SheetDescription>
            {isOnline 
              ? 'Essas denúncias estão aguardando sincronização.'
              : 'Você está offline. Essas denúncias serão enviadas quando a conexão for restabelecida.'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Button
            onClick={onRetrySync}
            disabled={isSyncing || !isOnline}
            className="w-full"
            variant={isOnline ? 'default' : 'secondary'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : isOnline ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Agora
              </>
            ) : (
              <>
                <CloudOff className="mr-2 h-4 w-4" />
                Sem Conexão
              </>
            )}
          </Button>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-3 pr-4">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border rounded-lg bg-muted/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES[report.category]?.label || report.category}
                      </Badge>
                      <p className="text-sm font-medium">
                        {report.title || 'Sem título'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(report.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <span className="font-mono">{report.protocol}</span>
                  </div>
                  
                  {report.syncAttempts > 0 && (
                    <p className="text-xs text-warning">
                      {report.syncAttempts} tentativa(s) de sincronização
                    </p>
                  )}
                  
                  {report.files && report.files.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      📎 {report.files.length} arquivo(s) anexado(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
