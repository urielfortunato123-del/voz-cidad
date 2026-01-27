import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, Check, Share, Plus, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // Detect platform
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    
    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };
  
  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-success/5 via-background to-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">
          App Instalado!
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          O {APP_NAME} já está instalado no seu dispositivo
        </p>
        <Button onClick={() => navigate('/home')} size="lg">
          <Home className="mr-2 h-5 w-5" />
          Ir para o app
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <main className="page-container pt-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <img src="/icons/icon-192x192.png" alt={APP_NAME} className="w-20 h-20 rounded-xl" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Instalar {APP_NAME}
          </h1>
          <p className="text-muted-foreground">
            Tenha acesso rápido direto da sua tela inicial
          </p>
        </div>
        
        {/* Benefits */}
        <div className="space-y-3 mb-10">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm">Acesso rápido sem abrir o navegador</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm">Funciona offline com dados salvos</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm">Carregamento mais rápido</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Check className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm">Experiência em tela cheia</span>
          </div>
        </div>
        
        {/* Install Button (Android/Desktop) */}
        {deferredPrompt && (
          <Button onClick={handleInstall} className="w-full btn-touch text-lg mb-6" size="lg">
            <Download className="mr-2 h-5 w-5" />
            Instalar Agora
          </Button>
        )}
        
        {/* iOS Instructions */}
        {isIOS && !deferredPrompt && (
          <Card className="card-elevated mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Como instalar no iPhone/iPad:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Toque no botão Compartilhar</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Share className="h-5 w-5 text-secondary" />
                      <span className="text-sm text-muted-foreground">Na barra inferior do Safari</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Selecione "Adicionar à Tela de Início"</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Plus className="h-5 w-5 text-secondary" />
                      <span className="text-sm text-muted-foreground">Role para encontrar a opção</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Toque em "Adicionar"</p>
                    <span className="text-sm text-muted-foreground">O app aparecerá na sua tela inicial</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Android Instructions (if prompt not available) */}
        {isAndroid && !deferredPrompt && (
          <Card className="card-elevated mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Como instalar no Android:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Abra o menu do navegador</p>
                    <span className="text-sm text-muted-foreground">Toque nos três pontos no canto superior</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                    <span className="text-sm text-muted-foreground">A opção pode variar conforme o navegador</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirme a instalação</p>
                    <span className="text-sm text-muted-foreground">O app será adicionado à sua tela inicial</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Skip button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/home')}
          className="w-full btn-touch text-muted-foreground"
        >
          Continuar no navegador
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </main>
    </div>
  );
}
