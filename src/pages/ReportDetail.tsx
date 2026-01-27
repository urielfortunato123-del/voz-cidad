import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, MapPin, User, EyeOff, ThumbsUp, Flag, 
  FileText, Send, ExternalLink, Loader2, AlertTriangle 
} from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { CategoryTag } from '@/components/CategoryTag';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useReport, useReportEvidences, useConfirmReport, useFlagReport } from '@/hooks/useReports';
import { generateReportPDF, downloadPDF } from '@/lib/pdf';
import { toast } from 'sonner';
import type { CategoryKey } from '@/lib/constants';

const FLAG_REASONS = [
  { value: 'dados_pessoais', label: 'Expõe dados pessoais' },
  { value: 'ofensa', label: 'Conteúdo ofensivo' },
  { value: 'spam', label: 'Spam / Irrelevante' },
  { value: 'sem_prova', label: 'Acusação sem fundamento' },
];

export default function ReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [flagReason, setFlagReason] = useState('');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  
  const { data: report, isLoading } = useReport(id || null);
  const { data: evidences } = useReportEvidences(id || null);
  const confirmReport = useConfirmReport();
  const flagReport = useFlagReport();
  
  const handleConfirm = async () => {
    if (!id) return;
    
    try {
      await confirmReport.mutateAsync(id);
      toast.success('Confirmação registrada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar');
    }
  };
  
  const handleFlag = async () => {
    if (!id || !flagReason) return;
    
    try {
      await flagReport.mutateAsync({ reportId: id, reason: flagReason });
      toast.success('Denúncia reportada');
      setFlagDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reportar');
    }
  };
  
  const handleGeneratePDF = () => {
    if (!report) return;
    
    const pdf = generateReportPDF({
      protocol: report.protocol,
      uf: report.uf,
      city: report.city,
      category: report.category as CategoryKey,
      title: report.title || undefined,
      description: report.description,
      occurred_at: report.occurred_at,
      address_text: report.address_text || undefined,
      lat: report.lat || undefined,
      lng: report.lng || undefined,
      is_anonymous: report.is_anonymous,
      author_name: report.author_name || undefined,
      author_contact: report.author_contact || undefined,
      created_at: report.created_at,
      evidences: evidences?.map(e => ({ file_name: e.file_name, created_at: e.created_at })),
    });
    
    downloadPDF(pdf, `denuncia-${report.protocol}.pdf`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Detalhes" showBack />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Detalhes" showBack />
        <div className="page-container text-center py-20">
          <p className="text-muted-foreground">Denúncia não encontrada</p>
        </div>
      </div>
    );
  }
  
  const authorDisplay = report.is_anonymous 
    ? 'Anônima' 
    : (report.show_name_publicly && report.author_name 
        ? report.author_name 
        : 'Identificada (privado)');
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Detalhes" showBack />
      
      <main className="page-container">
        {/* Header Info */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <CategoryTag category={report.category as CategoryKey} />
          <StatusBadge status={report.status} />
        </div>
        
        {/* Protocol */}
        <Card className="card-elevated mb-4">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <p className="text-xl font-mono font-bold text-primary tracking-wider">
              {report.protocol}
            </p>
          </CardContent>
        </Card>
        
        {/* Title */}
        {report.title && (
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            {report.title}
          </h2>
        )}
        
        {/* Description */}
        <Card className="card-elevated mb-4">
          <CardContent className="p-4">
            <p className="text-foreground whitespace-pre-wrap">{report.description}</p>
          </CardContent>
        </Card>
        
        {/* Metadata */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{report.city}/{report.uf}</span>
          </div>
          
          {report.address_text && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{report.address_text}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Ocorrido em {format(new Date(report.occurred_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Registrado em {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            {report.is_anonymous ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{authorDisplay}</span>
          </div>
          
          {report.confirmations_count > 0 && (
            <div className="flex items-center gap-3 text-sm text-primary">
              <ThumbsUp className="h-4 w-4" />
              <span>{report.confirmations_count} confirmações</span>
            </div>
          )}
        </div>
        
        {/* Evidences */}
        {evidences && evidences.length > 0 && (
          <div className="mb-6">
            <h3 className="section-header">Evidências</h3>
            <div className="space-y-2">
              {evidences.map((evidence) => (
                <a
                  key={evidence.id}
                  href={evidence.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <span className="text-sm truncate">{evidence.file_name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleConfirm}
              variant="outline"
              className="btn-touch"
              disabled={confirmReport.isPending}
            >
              <ThumbsUp className="mr-2 h-5 w-5" />
              Confirmar
            </Button>
            
            <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="btn-touch">
                  <Flag className="mr-2 h-5 w-5" />
                  Reportar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reportar abuso</DialogTitle>
                  <DialogDescription>
                    Selecione o motivo do seu reporte
                  </DialogDescription>
                </DialogHeader>
                <RadioGroup value={flagReason} onValueChange={setFlagReason} className="space-y-3">
                  {FLAG_REASONS.map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-3">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button 
                  onClick={handleFlag} 
                  disabled={!flagReason || flagReport.isPending}
                  className="w-full"
                >
                  Enviar reporte
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          
          <Button onClick={handleGeneratePDF} className="w-full btn-touch">
            <FileText className="mr-2 h-5 w-5" />
            Gerar PDF
          </Button>
          
          <Button 
            onClick={() => navigate(`/encaminhar/${report.id}`)}
            variant="secondary"
            className="w-full btn-touch"
          >
            <Send className="mr-2 h-5 w-5" />
            Encaminhar para órgão
          </Button>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
