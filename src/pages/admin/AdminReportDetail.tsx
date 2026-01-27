import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Flag, ThumbsUp, FileText, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryTag } from '@/components/CategoryTag';
import { StatusBadge } from '@/components/StatusBadge';
import { useReport, useReportEvidences } from '@/hooks/useReports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STATUSES, type CategoryKey, type StatusKey } from '@/lib/constants';
import { toast } from 'sonner';

export default function AdminReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const { data: report, isLoading } = useReport(id || null);
  const { data: evidences } = useReportEvidences(id || null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  
  const updateStatusMutation = useMutation({
    mutationFn: async (status: StatusKey) => {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Status atualizado!');
      setNewStatus(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar');
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Denúncia não encontrada</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Protocolo: {report.protocol}
          </h1>
          <p className="text-muted-foreground">
            Criado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CategoryTag category={report.category as CategoryKey} />
                <StatusBadge status={report.status as StatusKey} />
              </div>
              {report.title && (
                <CardTitle className="text-xl mt-2">{report.title}</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.description}</p>
            </CardContent>
          </Card>
          
          {/* Evidences */}
          {evidences && evidences.length > 0 && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidências ({evidences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {evidences.map((evidence) => (
                    <a
                      key={evidence.id}
                      href={evidence.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      {evidence.file_type.startsWith('image/') ? (
                        <img
                          src={evidence.file_url}
                          alt={evidence.file_name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center rounded mb-2">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm truncate">{evidence.file_name}</p>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Atualizar Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={newStatus || report.status}
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUSES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {newStatus && newStatus !== report.status && (
                <Button
                  className="w-full"
                  onClick={() => updateStatusMutation.mutate(newStatus as StatusKey)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Details */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{report.city}/{report.uf}</p>
                  {report.address_text && (
                    <p className="text-sm text-muted-foreground">{report.address_text}</p>
                  )}
                  {report.lat && report.lng && (
                    <p className="text-xs text-muted-foreground">
                      {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Data do ocorrido</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.occurred_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {report.is_anonymous ? 'Anônima' : 'Identificada'}
                  </p>
                  {!report.is_anonymous && report.author_name && (
                    <p className="text-sm text-muted-foreground">{report.author_name}</p>
                  )}
                  {report.author_contact && (
                    <p className="text-sm text-muted-foreground">{report.author_contact}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-1 text-success">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">{report.confirmations_count}</span>
                </div>
                <div className="flex items-center gap-1 text-destructive">
                  <Flag className="h-4 w-4" />
                  <span className="text-sm">{report.flags_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
