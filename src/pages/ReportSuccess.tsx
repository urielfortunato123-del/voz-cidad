import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, FileText, Send, Eye, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFPreview } from '@/components/PDFPreview';
import { useReportByProtocol, useReportEvidences } from '@/hooks/useReports';
import { generateReportPDF } from '@/lib/pdf';
import { APP_NAME } from '@/lib/constants';
import type { CategoryKey } from '@/lib/constants';
import type jsPDF from 'jspdf';

export default function ReportSuccess() {
  const navigate = useNavigate();
  const { protocol } = useParams<{ protocol: string }>();
  const { data: report, isLoading } = useReportByProtocol(protocol || null);
  const { data: evidences } = useReportEvidences(report?.id || null);
  
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const handleOpenPdfPreview = async () => {
    if (!report) return;
    
    setPdfPreviewOpen(true);
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
        evidences: evidences?.map(e => ({ 
          file_name: e.file_name, 
          file_url: e.file_url,
          file_type: e.file_type,
          created_at: e.created_at 
        })),
      });
      
      setGeneratedPdf(pdf);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-success/5 via-background to-background">
      <main className="page-container pt-12 pb-8">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Denúncia Registrada!
          </h1>
          <p className="text-muted-foreground">
            Sua denúncia foi registrada com sucesso
          </p>
        </div>
        
        {/* Protocol Card */}
        <Card className="card-elevated mb-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Protocolo</p>
            <p className="text-3xl font-mono font-bold text-primary tracking-wider">
              {protocol}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Guarde este código para acompanhamento
            </p>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleOpenPdfPreview}
            className="w-full btn-touch"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Visualizar Relatório PDF
          </Button>
          
          <Button 
            onClick={() => navigate(`/encaminhar/${report?.id}`)}
            variant="outline"
            className="w-full btn-touch"
            size="lg"
          >
            <Send className="mr-2 h-5 w-5" />
            Escolher órgão e enviar
          </Button>
          
          <Button 
            onClick={() => navigate(`/denuncia/${report?.id}`)}
            variant="ghost"
            className="w-full btn-touch"
            size="lg"
          >
            <Eye className="mr-2 h-5 w-5" />
            Ver detalhes
          </Button>
          
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
            💡 Visualize o PDF e compartilhe junto com o e-mail para o órgão responsável
          </p>
        </div>
      </main>
      
      {/* PDF Preview Modal */}
      <PDFPreview
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        pdf={generatedPdf}
        filename={`denuncia-${protocol}.pdf`}
        isLoading={isGeneratingPdf}
      />
    </div>
  );
}
