import { useState } from 'react';
import { FileText, Download, Share2, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadPDF, sharePDF } from '@/lib/pdf';
import type jsPDF from 'jspdf';

interface PDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdf: jsPDF | null;
  filename: string;
  isLoading?: boolean;
}

export function PDFPreview({ open, onOpenChange, pdf, filename, isLoading }: PDFPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Generate blob URL when PDF is ready
  const generatePreviewUrl = () => {
    if (pdf && !pdfUrl) {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    }
  };

  // Cleanup URL when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setZoom(100);
    onOpenChange(newOpen);
  };

  // Generate URL when opening
  if (open && pdf && !pdfUrl) {
    generatePreviewUrl();
  }

  const handleDownload = () => {
    if (pdf) {
      downloadPDF(pdf, filename);
    }
  };

  const handleShare = () => {
    if (pdf) {
      sharePDF(pdf, filename);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full sm:max-w-3xl flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              <span className="truncate">{filename}</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/50 relative min-h-0">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div 
              className="w-full h-full flex items-start justify-center p-4 overflow-auto"
              style={{ minHeight: '400px' }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="bg-white shadow-lg rounded-lg border border-border"
                style={{
                  width: `${zoom}%`,
                  height: '100%',
                  minHeight: '500px',
                  maxWidth: '100%',
                }}
                title="PDF Preview"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum PDF para exibir</p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-border flex-shrink-0 bg-card">
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-9 w-9"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-9 w-9"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 btn-touch"
              size="lg"
              disabled={!pdf}
            >
              <Download className="mr-2 h-5 w-5" />
              Baixar PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 btn-touch"
              size="lg"
              disabled={!pdf}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Compartilhar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
