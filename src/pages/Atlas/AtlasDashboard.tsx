import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, MapPin, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocationStats {
  level: string;
  total: number;
}

interface CoverageStats {
  total_locations: number;
  locations_with_data: number;
  coverage_percentage: number;
}

export default function AtlasDashboard() {
  // Fetch location counts
  const { data: locationStats } = useQuery({
    queryKey: ['atlas-location-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atlas_locations')
        .select('level');
      
      if (error) throw error;
      
      const stats = data.reduce((acc: Record<string, number>, loc) => {
        acc[loc.level] = (acc[loc.level] || 0) + 1;
        return acc;
      }, {});
      
      return stats;
    },
  });

  // Fetch people count
  const { data: peopleCount } = useQuery({
    queryKey: ['atlas-people-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('atlas_people')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch mandate stats
  const { data: mandateStats } = useQuery({
    queryKey: ['atlas-mandate-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atlas_mandates')
        .select('status, confidence');
      
      if (error) throw error;
      
      const confirmed = data.filter(m => m.confidence === 'CONFIRMADO').length;
      const total = data.length;
      
      return {
        total,
        confirmed,
        unconfirmed: total - confirmed,
        percentage: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      };
    },
  });

  // Fetch recent jobs
  const { data: recentJobs } = useQuery({
    queryKey: ['atlas-recent-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atlas_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch offices count
  const { data: officesCount } = useQuery({
    queryKey: ['atlas-offices-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('atlas_offices')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const municipios = locationStats?.MUNICIPAL || 0;
  const estados = locationStats?.ESTADUAL || 0;
  const federal = locationStats?.FEDERAL || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">Atlas Político Brasil</h1>
          <p className="text-muted-foreground mt-1">
            Dados públicos, com responsabilidade.
          </p>
        </div>
      </header>

      <main className="px-4 -mt-4 max-w-4xl mx-auto space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{municipios.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Municípios</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{estados}</p>
                  <p className="text-xs text-muted-foreground">Estados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{peopleCount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Políticos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{officesCount}</p>
                  <p className="text-xs text-muted-foreground">Cargos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Cobertura de Dados
            </CardTitle>
            <CardDescription>
              Porcentagem de dados confirmados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Mandatos Confirmados</span>
                <span className="text-sm text-muted-foreground">
                  {mandateStats?.confirmed || 0} de {mandateStats?.total || 0}
                </span>
              </div>
              <Progress value={mandateStats?.percentage || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {mandateStats?.percentage || 0}% dos dados estão confirmados
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{mandateStats?.confirmed || 0}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{mandateStats?.unconfirmed || 0}</p>
                <p className="text-xs text-muted-foreground">Não Confirmados</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{mandateStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/atlas/federal" className="group">
            <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Federal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Presidente, Ministros, Senadores e Deputados Federais
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/atlas/estados" className="group">
            <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Estados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Governadores, Secretários e Deputados Estaduais
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/atlas/municipios" className="group">
            <Card className="h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Municípios</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Prefeitos, Vereadores e Secretários Municipais
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Últimas Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs && recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {job.status === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {job.status === 'RUNNING' && <Clock className="h-4 w-4 text-amber-500 animate-pulse" />}
                      {job.status === 'FAILED' && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {job.status === 'PARTIAL' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      <div>
                        <p className="text-sm font-medium">{job.job_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.started_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        job.status === 'SUCCESS' ? 'default' :
                        job.status === 'RUNNING' ? 'secondary' :
                        'destructive'
                      }>
                        {job.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        +{job.records_created} / {job.records_failed} erros
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atualização recente
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
