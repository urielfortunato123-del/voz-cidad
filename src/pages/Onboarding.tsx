import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, FileText, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { setOnboardingComplete } from '@/lib/device';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

export default function Onboarding() {
  const navigate = useNavigate();
  
  const handleStart = () => {
    setOnboardingComplete();
    navigate('/selecionar-local');
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 right-1/4 w-40 h-40 bg-primary/15 rounded-full blur-[60px]" />
      </div>

      <motion.div 
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo area */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-2xl glow-primary-intense">
            <Shield className="w-12 h-12 text-primary-foreground" />
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-primary-light/30 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-4xl font-bold text-foreground text-center mb-3"
        >
          <span className="text-gradient-primary">{APP_NAME}</span>
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-muted-foreground text-center mb-14"
        >
          Sua voz, sua cidade, seu país
        </motion.p>
        
        {/* Features */}
        <motion.div variants={itemVariants} className="w-full max-w-sm space-y-4 mb-12">
          <motion.div 
            className="flex items-start gap-4 p-5 glass rounded-2xl"
            whileHover={{ scale: 1.02, x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Registre fatos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descreva problemas na sua cidade com fotos e documentos
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-start gap-4 p-5 glass rounded-2xl"
            whileHover={{ scale: 1.02, x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="p-3 bg-gradient-to-br from-info/20 to-info/5 rounded-2xl">
              <FileText className="w-6 h-6 text-info" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Gere relatórios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Crie PDFs oficiais com protocolo para acompanhamento
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-start gap-4 p-5 glass rounded-2xl"
            whileHover={{ scale: 1.02, x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl">
              <Send className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Encaminhe</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Envie diretamente para o órgão responsável
              </p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Legal Warning */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-sm p-5 bg-destructive/10 border border-destructive/30 rounded-2xl mb-8"
        >
          <div className="flex gap-4">
            <div className="p-2 bg-destructive/20 rounded-xl h-fit">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              <strong className="text-destructive font-bold">Atenção:</strong> Denúncias falsas são crime (Art. 339 CP) 
              e podem resultar em processo e prisão. Relate apenas fatos verídicos.
            </p>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="px-6 pb-10 safe-area-bottom relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Button 
          onClick={handleStart}
          className="w-full h-14 text-lg font-bold"
          size="lg"
        >
          Começar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
