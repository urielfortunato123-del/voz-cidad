import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Copy, Eye, Loader2, Shield } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AgencyCard } from '@/components/AgencyCard';
import { PDFPreview } from '@/components/PDFPreview';
import { TempEmailGuide } from '@/components/TempEmailGuide';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReport, useReportEvidences } from '@/hooks/useReports';
import { useAgencies, type Agency } from '@/hooks/useAgencies';
import { generateEmailContent, openMailto, copyToClipboard } from '@/lib/email';
import { generateReportPDF } from '@/lib/pdf';
import { AGENCY_SCOPES, type CategoryKey } from '@/lib/constants';
import { toast } from 'sonner';
import type jsPDF from 'jspdf';

export default function ForwardReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [tempEmailGuideOpen, setTempEmailGuideOpen] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const { data: report, isLoading: loadingReport } = useReport(id || null);
  const { data: evidences } = useReportEvidences(id || null);
  const { data: agencies, isLoading: loadingAgencies } = useAgencies(
    report?.uf || null,
    report?.city || null,
    report?.category as CategoryKey
  );
  
  const handleSelectAgency = (agency: Agency) => {
    setSelectedAgency(agency);
  };
  
  const handleOpenEmail = () => {
    if (!report || !selectedAgency) return;
    
    const { subject, body } = generateEmailContent({
      protocol: report.protocol,
      uf: report.uf,
      city: report.city,
      category: report.category as CategoryKey,
      description: report.description,
      address_text: report.address_text || undefined,
      lat: report.lat || undefined,
      lng: report.lng || undefined,
      author_name: report.author_name || undefined,
      is_anonymous: report.is_anonymous,
    }, selectedAgency.email);
    
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
  
  const generatePdf = async () => {
    if (!report || generatedPdf) return;

    setIsGeneratingPdf(true);
    try {
      const pdf = await generateReportPDF({
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

  // Get email content for temp email guide
  const getEmailContent = () => {
    if (!report || !selectedAgency) return { subject: '', body: '' };
    return generateEmailContent(
      {
        protocol: report.protocol,
        uf: report.uf,
        city: report.city,
        category: report.category as CategoryKey,
        description: report.description,
        address_text: report.address_text || undefined,
        lat: report.lat || undefined,
        lng: report.lng || undefined,
        author_name: report.author_name || undefined,
        is_anonymous: report.is_anonymous,
      },
      selectedAgency.email
    );
  };
  
  const isLoading = loadingReport || loadingAgencies;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Encaminhar" showBack />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Encaminhar" showBack />
        <div className="page-container text-center py-20">
          <p className="text-muted-foreground">Denúncia não encontrada</p>
        </div>
      </div>
    );
  }
  
  // Group agencies by scope
  const groupedAgencies = agencies?.reduce((acc, agency) => {
    if (!acc[agency.scope]) {
      acc[agency.scope] = [];
    }
    acc[agency.scope].push(agency);
    return acc;
  }, {} as Record<string, Agency[]>);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Escolher Órgão" showBack />
      
      <main className="page-container">
        <p className="text-muted-foreground mb-6">
          Selecione o órgão para enviar sua denúncia (Protocolo: {report.protocol})
        </p>
        
        {agencies && agencies.length > 0 ? (
          <div className="space-y-6">
            {(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'] as const).map((scope) => {
              const scopeAgencies = groupedAgencies?.[scope];
              if (!scopeAgencies?.length) return null;
              
              return (
                <div key={scope}>
                  <h3 className="section-header">{AGENCY_SCOPES[scope]}</h3>
                  <div className="space-y-3">
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
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Nenhum órgão encontrado para esta categoria
            </p>
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
            
            {/* Anonymous email suggestion */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Quer manter seu e-mail anônimo?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use um serviço de e-mail temporário para enviar sua denúncia.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setTempEmailGuideOpen(true)}
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
        filename={`denuncia-${report?.protocol}.pdf`}
        isLoading={isGeneratingPdf}
      />

      {/* Temp Email Guide */}
      {selectedAgency && (
        <TempEmailGuide
          open={tempEmailGuideOpen}
          onOpenChange={setTempEmailGuideOpen}
          recipientEmail={selectedAgency.email}
          emailSubject={getEmailContent().subject}
          emailBody={getEmailContent().body}
          pdf={generatedPdf}
          pdfFilename={`denuncia-${report?.protocol}.pdf`}
          onGeneratePdf={generatePdf}
          isGeneratingPdf={isGeneratingPdf}
        />
      )}

      <BottomNav />
    </div>
  );
}
