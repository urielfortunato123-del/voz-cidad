import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedLocation, clearSelectedLocation } from '@/lib/device';
import { CATEGORIES, STATUSES, type CategoryKey, type StatusKey } from '@/lib/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  
  const { data: reports, isLoading } = useQuery({
    queryKey: ['dashboard-reports', location?.uf, location?.city],
    queryFn: async () => {
      if (!location) return [];
      
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, status, created_at, confirmations_count')
        .eq('uf', location.uf)
        .eq('city', location.city);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!location,
  });
  
  const stats = useMemo(() => {
    if (!reports) return null;
    
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'RESOLVIDA').length;
    const pending = reports.filter(r => ['RECEBIDA', 'EM_ANALISE'].includes(r.status)).length;
    const forwarded = reports.filter(r => r.status === 'ENCAMINHADA').length;
    
    // Category breakdown
    const byCategory = Object.entries(CATEGORIES).map(([key, { label, color }]) => ({
      name: label,
      value: reports.filter(r => r.category === key).length,
      color: `hsl(var(--category-${key.toLowerCase().replace('_', '-')}))`,
      key,
    })).filter(c => c.value > 0);
    
    // Status breakdown
    const byStatus = Object.entries(STATUSES).map(([key, { label }]) => ({
      name: label,
      value: reports.filter(r => r.status === key).length,
      key,
    })).filter(s => s.value > 0);
    
    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = reports.filter(r => r.created_at.startsWith(dateStr)).length;
      return {
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        count,
      };
    });
    
    return { total, resolved, pending, forwarded, byCategory, byStatus, last7Days };
  }, [reports]);
  
  const handleChangeLocation = () => {
    clearSelectedLocation();
    navigate('/selecionar-local');
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  const CATEGORY_COLORS = ['#E91E63', '#FF9800', '#2196F3', '#26A69A', '#4CAF50', '#9C27B0', '#F44336'];
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        title="Estatísticas"
        showLocation={location}
        onLocationClick={handleChangeLocation}
      />
      
      <main className="page-container">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats && stats.total > 0 ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{stats.resolved}</p>
                      <p className="text-sm text-muted-foreground">Resolvidas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.forwarded}</p>
                      <p className="text-sm text-muted-foreground">Encaminhadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Category Chart */}
            <Card className="card-elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {stats.byCategory.map((entry, index) => (
                          <Cell key={entry.key} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Trend Chart */}
            <Card className="card-elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Últimos 7 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.last7Days}>
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Status Breakdown */}
            <Card className="card-elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byStatus.map(({ name, value, key }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{name}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma denúncia registrada nesta cidade ainda
            </p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
