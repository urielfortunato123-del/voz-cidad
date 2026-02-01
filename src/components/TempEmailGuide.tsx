import { useState } from 'react';
import { Check, Copy, Download, ExternalLink, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import type jsPDF from 'jspdf';

const TEMP_EMAIL_SERVICES = [
  { name: 'Temp Mail', url: 'https://temp-mail.org/pt/', description: 'Mais popular' },
  { name: 'Guerrilla Mail', url: 'https://www.guerrillamail.com/pt/', description: 'Permite anexos' },
  { name: 'EmailOnDeck', url: 'https://www.emailondeck.com/pt/', description: 'Simples e rápido' },
  { name: '10 Minute Mail', url: 'https://10minutemail.com/', description: 'Expira em 10 min' },
];

interface TempEmailGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  emailSubject: string;
  emailBody: string;
  pdf: jsPDF | null;
  pdfFilename: string;
  onGeneratePdf?: () => Promise<void>;
  isGeneratingPdf?: boolean;
}

export function TempEmailGuide({
  open,
  onOpenChange,
  recipientEmail,
  emailSubject,
  emailBody,
  pdf,
  pdfFilename,
  onGeneratePdf,
  isGeneratingPdf,
}: TempEmailGuideProps) {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'subject' | 'body' | null>(null);

  const handleDownloadPdf = async () => {
    if (!pdf && onGeneratePdf) {
      await onGeneratePdf();
    }
    
    if (pdf) {
      pdf.save(pdfFilename);
      setStep1Done(true);
      toast.success('PDF baixado! Agora copie o texto do email.');
    }
  };

  const handleCopy = async (text: string, field: 'email' | 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      
      if (field === 'body') {
        setStep2Done(true);
        toast.success('Texto copiado! Agora abra o serviço de email.');
      } else {
        toast.success('Copiado!');
      }
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleOpenService = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const resetSteps = () => {
    setStep1Done(false);
    setStep2Done(false);
    setCopiedField(null);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetSteps();
    }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DrawerTitle>Enviar com Email Temporário</DrawerTitle>
              <DrawerDescription>
                Envie sua denúncia sem revelar seu email pessoal
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Step 1: Download PDF */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${step1Done ? 'border-success bg-success/5' : 'border-primary bg-primary/5'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step1Done ? 'bg-success text-white' : 'bg-primary text-white'}`}>
                {step1Done ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <h3 className="font-semibold">Baixe o relatório PDF</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Você vai anexar este arquivo ao email temporário
            </p>
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full"
              variant={step1Done ? 'outline' : 'default'}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? 'Gerando PDF...' : step1Done ? 'PDF Baixado ✓' : 'Baixar PDF'}
            </Button>
          </div>

          {/* Step 2: Copy email content */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${step2Done ? 'border-success bg-success/5' : step1Done ? 'border-primary bg-primary/5' : 'border-muted bg-muted/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step2Done ? 'bg-success text-white' : step1Done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {step2Done ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <h3 className={`font-semibold ${!step1Done ? 'text-muted-foreground' : ''}`}>Copie o conteúdo do email</h3>
            </div>
            
            <div className="space-y-3">
              {/* Recipient */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Para:</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm truncate">
                    {recipientEmail}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(recipientEmail, 'email')}
                    disabled={!step1Done}
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Assunto:</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm truncate">
                    {emailSubject}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(emailSubject, 'subject')}
                    disabled={!step1Done}
                  >
                    {copiedField === 'subject' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mensagem:</label>
                <div className="bg-background border border-border rounded-lg p-3 text-sm max-h-24 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs">{emailBody.substring(0, 200)}...</pre>
                </div>
                <Button
                  onClick={() => handleCopy(emailBody, 'body')}
                  disabled={!step1Done}
                  className="w-full mt-2"
                  variant={step2Done ? 'outline' : step1Done ? 'default' : 'secondary'}
                >
                  {copiedField === 'body' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {step2Done ? 'Texto Copiado ✓' : 'Copiar texto completo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Open temp email service */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${step2Done ? 'border-primary bg-primary/5' : 'border-muted bg-muted/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step2Done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <h3 className={`font-semibold ${!step2Done ? 'text-muted-foreground' : ''}`}>Abra o serviço e envie</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              Cole o destinatário, assunto e texto. Anexe o PDF baixado.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {TEMP_EMAIL_SERVICES.map((service) => (
                <button
                  key={service.name}
                  onClick={() => handleOpenService(service.url)}
                  disabled={!step2Done}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    step2Done
                      ? 'border-primary/30 bg-background hover:bg-primary/5 hover:border-primary'
                      : 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {service.name}
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <span className="text-xs text-muted-foreground">{service.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> O Guerrilla Mail permite anexar arquivos facilmente. 
              Após abrir o serviço, clique em "Compose" ou "Escrever", cole os dados e anexe o PDF.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
