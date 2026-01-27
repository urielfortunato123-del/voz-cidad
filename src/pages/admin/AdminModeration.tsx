import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryTag } from '@/components/CategoryTag';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type CategoryKey } from '@/lib/constants';
import { toast } from 'sonner';

export default function AdminModeration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: flaggedReports, isLoading } = useQuery({
    queryKey: ['admin-flagged-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .or('flags_count.gt.0,status.eq.SOB_REVISAO')
        .order('flags_count', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'RECEBIDA' | 'ARQUIVADA' }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status, flags_count: 0 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-reports'] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar');
    },
  });
  
  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'RECEBIDA' });
  };
  
  const handleArchive = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'ARQUIVADA' });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Moderação</h1>
        <p className="text-muted-foreground">Revisar denúncias reportadas</p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : flaggedReports && flaggedReports.length > 0 ? (
        <div className="space-y-4">
          {flaggedReports.map((report) => (
            <Card key={report.id} className="card-elevated border-l-4 border-l-destructive">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{report.protocol}</span>
                    <CategoryTag category={report.category as CategoryKey} size="sm" />
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <Flag className="h-4 w-4" />
                    <span className="text-sm font-semibold">{report.flags_count}</span>
                  </div>
                </div>
                
                <p className="text-sm mb-2">
                  {report.title || report.description.substring(0, 150) + '...'}
                </p>
                
                <p className="text-xs text-muted-foreground mb-4">
                  {report.city}/{report.uf} • {new Date(report.created_at).toLocaleDateString('pt-BR')}
                  {report.is_anonymous ? ' • Anônima' : ` • ${report.author_name || 'Identificada'}`}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/denuncia/${report.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(report.id)}
                    disabled={updateStatusMutation.isPending}
                    className="text-success hover:text-success"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(report.id)}
                    disabled={updateStatusMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Arquivar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma denúncia para moderar</p>
        </div>
      )}
    </div>
  );
}
