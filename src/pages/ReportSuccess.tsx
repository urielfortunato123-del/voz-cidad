import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, Eye, Home, CloudOff, RefreshCw, Shield, Mail, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFPreview } from '@/components/PDFPreview';
import { TempEmailGuide } from '@/components/TempEmailGuide';
import { AgencyCard } from '@/components/AgencyCard';
import { useReportByProtocol, useReportEvidences } from '@/hooks/useReports';
import { useAgencies, type Agency } from '@/hooks/useAgencies';
import { useOffline } from '@/contexts/OfflineContext';
import { generateReportPDF } from '@/lib/pdf';
import { generateEmailContent, openMailto, copyToClipboard } from '@/lib/email';
import { APP_NAME, CATEGORIES, AGENCY_SCOPES } from '@/lib/constants';
import type { CategoryKey } from '@/lib/constants';
import type jsPDF from 'jspdf';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReportSuccess() {
  const navigate = useNavigate();
  const { protocol } = useParams<{ protocol: string }>();
  const [searchParams] = useSearchParams();
  const isOffline = searchParams.get('offline') === 'true';
  
  const { data: report, isLoading } = useReportByProtocol(isOffline ? null : (protocol || null));
  const { data: evidences } = useReportEvidences(report?.id || null);
  const { pendingReports, isOnline, isSyncing, retrySync } = useOffline();
  
  // Find pending report if offline
  const pendingReport = isOffline ? pendingReports.find(r => r.protocol === protocol) : null;
  const reportData = report || pendingReport;
  
  // Fetch agencies based on report's location and category
  const { data: agencies, isLoading: loadingAgencies } = useAgencies(
    reportData?.uf || null,
    reportData?.city || null,
    reportData?.category as CategoryKey
  );
  
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [tempEmailGuideOpen, setTempEmailGuideOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const generatePdf = async () => {
    if (!reportData || generatedPdf) return;

    setIsGeneratingPdf(true);
    try {
      const pdf = await generateReportPDF({
        protocol: reportData.protocol,
        uf: reportData.uf,
        city: reportData.city,
        category: reportData.category as CategoryKey,
        title: reportData.title || undefined,
        description: reportData.description,
        occurred_at: reportData.occurred_at,
        address_text: reportData.address_text || undefined,
        lat: reportData.lat || undefined,
        lng: reportData.lng || undefined,
        is_anonymous: reportData.is_anonymous,
        author_name: reportData.author_name || undefined,
        author_contact: reportData.author_contact || undefined,
        created_at: reportData.created_at,
        evidences: evidences?.map((e) => ({
          file_name: e.file_name,
          file_url: e.file_url,
          file_type: e.file_type,
          created_at: e.created_at,
        })),
      });
      setGeneratedPdf(pdf);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPdfPreview = async () => {
    setPdfPreviewOpen(true);
    if (!generatedPdf) {
      await generatePdf();
    }
  };

  // Generate email content for agency dialog
  const getEmailContent = (agencyEmail: string) => {
    if (!reportData) return { subject: '', body: '' };
    return generateEmailContent({
      protocol: reportData.protocol,
      uf: reportData.uf,
      city: reportData.city,
      category: reportData.category as CategoryKey,
      description: reportData.description,
      address_text: reportData.address_text || undefined,
      lat: reportData.lat || undefined,
      lng: reportData.lng || undefined,
      author_name: reportData.author_name || undefined,
      is_anonymous: reportData.is_anonymous,
    }, agencyEmail);
  };

  const handleSelectAgency = (agency: Agency) => {
    setSelectedAgency(agency);
  };

  const handleOpenEmail = () => {
    if (!reportData || !selectedAgency) return;
    const { subject, body } = getEmailContent(selectedAgency.email);
    openMailto(selectedAgency.email, subject, body);
  };

  const handleCopyEmail = async () => {
    if (!selectedAgency) return;
    try {
      await copyToClipboard(selectedAgency.email);
      toast.success('E-mail copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Group agencies by scope
  const groupedAgencies = agencies?.reduce((acc, agency) => {
    if (!acc[agency.scope]) {
      acc[agency.scope] = [];
    }
    acc[agency.scope].push(agency);
    return acc;
  }, {} as Record<string, Agency[]>);

  const emailSubject = reportData
    ? `Denúncia Cidadã - Protocolo ${reportData.protocol} - ${CATEGORIES[reportData.category as CategoryKey]?.label || ''}`
    : '';
  const emailBody = reportData
    ? `Prezado(a),

Encaminho denúncia registrada através do aplicativo ${APP_NAME}.

PROTOCOLO: ${reportData.protocol}
CATEGORIA: ${CATEGORIES[reportData.category as CategoryKey]?.label || ''}
LOCAL: ${reportData.city}/${reportData.uf}
${reportData.address_text ? `ENDEREÇO: ${reportData.address_text}` : ''}

DESCRIÇÃO:
${reportData.description}

${reportData.is_anonymous ? 'Esta denúncia foi registrada de forma anônima.' : `Denunciante: ${reportData.author_name || 'Não informado'}`}

Segue em anexo o relatório completo em PDF.

Atenciosamente,
${APP_NAME}`
    : '';
  
  if (isLoading && !isOffline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }
  
  const isPending = isOffline && pendingReport;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-success/5 via-background to-background">
      <main className="page-container pt-12 pb-8">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-20 h-20 ${isPending ? 'bg-warning/20' : 'bg-success/20'} rounded-full flex items-center justify-center mb-6 animate-scale-in`}>
            {isPending ? (
              <CloudOff className="w-10 h-10 text-warning" />
            ) : (
              <CheckCircle className="w-10 h-10 text-success" />
            )}
          </div>
          
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            {isPending ? 'Denúncia Salva Localmente!' : 'Denúncia Registrada!'}
          </h1>
          <p className="text-muted-foreground">
            {isPending 
              ? 'Será enviada automaticamente quando houver conexão'
              : 'Sua denúncia foi registrada com sucesso'
            }
          </p>
        </div>
        
        {/* Protocol Card */}
        <Card className={`card-elevated mb-8 ${isPending ? 'border-warning' : ''}`}>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Protocolo</p>
            <p className={`text-3xl font-mono font-bold tracking-wider ${isPending ? 'text-warning' : 'text-primary'}`}>
              {protocol}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isPending ? 'Pendente de sincronização' : 'Guarde este código para acompanhamento'}
            </p>
            
            {isPending && pendingReport && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Categoria:</strong> {CATEGORIES[pendingReport.category]?.label}
                </p>
                {pendingReport.files && pendingReport.files.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📎 {pendingReport.files.length} arquivo(s) anexado(s)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sync button for pending reports */}
        {isPending && isOnline && (
          <Button 
            onClick={retrySync}
            disabled={isSyncing}
            className="w-full btn-touch mb-4"
            size="lg"
            variant="default"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Sincronizar Agora
              </>
            )}
          </Button>
        )}
        
        {/* Agencies List - Show when not offline */}
        {!isPending && reportData && (
          <div className="mb-8">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
              📨 Enviar para órgão responsável
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione um órgão para encaminhar sua denúncia:
            </p>
            
            {loadingAgencies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agencies && agencies.length > 0 ? (
              <div className="space-y-4">
                {(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'] as const).map((scope) => {
                  const scopeAgencies = groupedAgencies?.[scope];
                  if (!scopeAgencies?.length) return null;
                  
                  return (
                    <div key={scope}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {AGENCY_SCOPES[scope]}
                      </h3>
                      <div className="space-y-2">
                        {scopeAgencies.map((agency) => (
                          <AgencyCard 
                            key={agency.id} 
                            agency={agency} 
                            onSelect={handleSelectAgency}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum órgão encontrado para esta categoria na sua região
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleOpenPdfPreview}
            className="w-full btn-touch"
            size="lg"
            disabled={!report && !pendingReport}
          >
            <FileText className="mr-2 h-5 w-5" />
            Visualizar Relatório PDF
          </Button>
          
          {!isPending && report && (
            <Button 
              onClick={() => navigate(`/denuncia/${report.id}`)}
              variant="ghost"
              className="w-full btn-touch"
              size="lg"
            >
              <Eye className="mr-2 h-5 w-5" />
              Ver detalhes
            </Button>
          )}
          
          <Button 
            onClick={() => navigate('/home')}
            variant="ghost"
            className="w-full btn-touch text-muted-foreground"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Voltar ao início
          </Button>
        </div>
        
        {/* Share tip */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            {isPending 
              ? '📴 Quando a conexão for restabelecida, sua denúncia será enviada automaticamente'
              : '💡 Clique em um órgão acima para abrir seu e-mail com a denúncia pronta'
            }
          </p>
        </div>
        
        {/* Anonymous email suggestion */}
        {!isPending && (
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Quer manter seu e-mail anônimo?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use um serviço de e-mail temporário para enviar sua denúncia sem revelar seu e-mail pessoal.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setTempEmailGuideOpen(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Usar email temporário
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Agency Detail Dialog */}
      <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgency?.name}</DialogTitle>
            <DialogDescription>
              {selectedAgency && AGENCY_SCOPES[selectedAgency.scope]}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1 break-all">{selectedAgency?.email}</span>
              <Button variant="ghost" size="icon" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={handleOpenEmail} className="w-full btn-touch">
              <Mail className="mr-2 h-5 w-5" />
              Abrir e-mail pronto
            </Button>
            
            <Button onClick={handleOpenPdfPreview} variant="outline" className="w-full btn-touch">
              <Eye className="mr-2 h-5 w-5" />
              Visualizar PDF
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              💡 Visualize o PDF e baixe para anexar ao e-mail
            </p>
            
            {/* Anonymous email suggestion in dialog */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Quer manter seu e-mail anônimo?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setSelectedAgency(null);
                      setTempEmailGuideOpen(true);
                    }}
                  >
                    <Shield className="h-3 w-3 mr-2" />
                    Usar email temporário
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreview
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        pdf={generatedPdf}
        filename={`denuncia-${protocol}.pdf`}
        isLoading={isGeneratingPdf}
      />

      {/* Temp Email Guide */}
      <TempEmailGuide
        open={tempEmailGuideOpen}
        onOpenChange={setTempEmailGuideOpen}
        recipientEmail={selectedAgency?.email || agencies?.[0]?.email || 'orgao@exemplo.gov.br'}
        emailSubject={emailSubject}
        emailBody={emailBody}
        pdf={generatedPdf}
        pdfFilename={`denuncia-${protocol}.pdf`}
        onGeneratePdf={generatePdf}
        isGeneratingPdf={isGeneratingPdf}
      />
    </div>
  );
}
