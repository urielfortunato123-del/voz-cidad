import { useNavigate } from 'react-router-dom';
import { PlusCircle, List, Building2, BarChart3, Map, ChevronRight, MapPin, Search } from 'lucide-react';
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
    color: 'bg-primary/10 text-primary',
  },
  {
    path: '/denuncias',
    icon: List,
    title: 'Ver Denúncias',
    description: 'Denúncias da sua cidade',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    path: '/mapa',
    icon: Map,
    title: 'Mapa',
    description: 'Visualizar no mapa',
    color: 'bg-info/10 text-info',
  },
  {
    path: '/estatisticas',
    icon: BarChart3,
    title: 'Estatísticas',
    description: 'Dashboard da cidade',
    color: 'bg-success/10 text-success',
  },
  {
    path: '/orgaos',
    icon: Building2,
    title: 'Órgãos Públicos',
    description: 'Encontrar contatos',
    color: 'bg-accent/20 text-accent-foreground',
  },
];

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
    <div className="min-h-screen bg-background pb-20">
      <Header 
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container pt-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
            Olá, cidadão!
          </h2>
          <p className="text-muted-foreground">
            O que você gostaria de fazer hoje?
          </p>
        </div>
        
        {/* Protocol Search */}
        <Card className="card-elevated mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              <Search className="h-4 w-4 inline mr-1" />
              Acompanhar denúncia
            </p>
            <ProtocolSearch />
          </CardContent>
        </Card>
        
        {/* Location Card */}
        <Card className="card-elevated mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cidade atual</p>
                  <p className="font-semibold text-foreground">
                    {location.city}/{location.uf}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleChangeLocation}>
                Trocar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Menu Cards */}
        <div className="space-y-4">
          {MENU_ITEMS.map(({ path, icon: Icon, title, description, color }) => (
            <Card 
              key={path}
              className="card-elevated cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl', color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Info Box */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            💡 Dica: Evite expor dados pessoais de terceiros e relate apenas fatos que você presenciou.
          </p>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
