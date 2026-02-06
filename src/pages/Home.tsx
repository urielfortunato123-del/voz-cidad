import { useNavigate } from 'react-router-dom';
import { PlusCircle, List, Building2, BarChart3, Map, ChevronRight, MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtocolSearch } from '@/components/ProtocolSearch';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  {
    path: '/nova-denuncia',
    icon: PlusCircle,
    title: 'Nova Denúncia',
    description: 'Registrar um problema',
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    glow: true,
  },
  {
    path: '/denuncias',
    icon: List,
    title: 'Ver Denúncias',
    description: 'Denúncias da sua cidade',
    gradient: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary-foreground',
  },
  {
    path: '/mapa',
    icon: Map,
    title: 'Mapa',
    description: 'Visualizar no mapa',
    gradient: 'from-info/20 to-info/5',
    iconColor: 'text-info',
  },
  {
    path: '/estatisticas',
    icon: BarChart3,
    title: 'Estatísticas',
    description: 'Dashboard da cidade',
    gradient: 'from-success/20 to-success/5',
    iconColor: 'text-success',
  },
  {
    path: '/orgaos',
    icon: Building2,
    title: 'Órgãos Públicos',
    description: 'Encontrar contatos',
    gradient: 'from-warning/20 to-warning/5',
    iconColor: 'text-warning',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

export default function Home() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container pt-6">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Bem-vindo</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-gradient-primary">Fiscaliza Brasil</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Sua voz, sua cidade, seu país
          </p>
        </motion.div>
        
        {/* Protocol Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-glass mb-6 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/15 rounded-xl">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Acompanhar denúncia
                </span>
              </div>
              <ProtocolSearch />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="card-glass mb-8 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <MapPin className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Cidade atual</p>
                    <p className="font-bold text-lg text-foreground">
                      {location.city}/{location.uf}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleChangeLocation}
                  className="rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/10"
                >
                  Trocar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Menu Cards */}
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {MENU_ITEMS.map(({ path, icon: Icon, title, description, gradient, iconColor, glow }, index) => (
            <motion.div
              key={path}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  'card-interactive overflow-hidden',
                  glow && 'hover:glow-primary'
                )}
                onClick={() => navigate(path)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={cn('p-3.5 rounded-2xl bg-gradient-to-br', gradient)}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Icon className={cn('h-6 w-6', iconColor)} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg">{title}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <motion.div
                      animate={{ x: 0 }}
                      whileHover={{ x: 4 }}
                    >
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Info Box */}
        <motion.div 
          className="mt-10 p-5 glass rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            💡 <span className="font-medium">Dica:</span> Evite expor dados pessoais de terceiros e relate apenas fatos que você presenciou.
          </p>
        </motion.div>
      </main>
      
      <BottomNav />
    </div>
  );
}
