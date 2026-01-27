import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { setOnboardingComplete } from '@/lib/device';

export default function Onboarding() {
  const navigate = useNavigate();
  
  const handleStart = () => {
    setOnboardingComplete();
    navigate('/selecionar-local');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo area */}
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Shield className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h1 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
          {APP_NAME}
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Sua voz, sua cidade
        </p>
        
        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-12">
          <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Registre fatos</h3>
              <p className="text-sm text-muted-foreground">
                Descreva problemas na sua cidade com fotos e documentos
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Gere relatórios</h3>
              <p className="text-sm text-muted-foreground">
                Crie PDFs oficiais com protocolo para acompanhamento
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Send className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Encaminhe</h3>
              <p className="text-sm text-muted-foreground">
                Envie diretamente para o órgão responsável
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-8 safe-area-bottom">
        <Button 
          onClick={handleStart}
          className="w-full btn-touch text-lg"
          size="lg"
        >
          Começar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
