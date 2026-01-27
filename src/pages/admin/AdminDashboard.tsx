import { useMemo } from 'react';
import { BarChart3, FileText, CheckCircle2, Clock, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, STATUSES } from '@/lib/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, status, created_at, flags_count, uf, city');
      
      if (error) throw error;
      return data || [];
    },
  });
  
  const stats = useMemo(() => {
    if (!reports) return null;
    
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'RESOLVIDA').length;
    const pending = reports.filter(r => ['RECEBIDA', 'EM_ANALISE'].includes(r.status)).length;
    const flagged = reports.filter(r => r.flags_count > 0).length;
    const underReview = reports.filter(r => r.status === 'SOB_REVISAO').length;
    
    // By category
    const byCategory = Object.entries(CATEGORIES).map(([key, { label }]) => ({
      name: label,
      value: reports.filter(r => r.category === key).length,
      key,
    })).filter(c => c.value > 0);
    
    // Top cities
    const cityCounts: Record<string, number> = {};
    reports.forEach(r => {
      const key = `${r.city}/${r.uf}`;
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    });
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    return { total, resolved, pending, flagged, underReview, byCategory, topCities };
  }, [reports]);
  
  const COLORS = ['#E91E63', '#FF9800', '#2196F3', '#26A69A', '#4CAF50', '#9C27B0', '#F44336'];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>
      
      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
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
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Flag className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.flagged}</p>
                    <p className="text-sm text-muted-foreground">Reportadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.underReview}</p>
                    <p className="text-sm text-muted-foreground">Sob revisão</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Category Chart */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {stats.byCategory.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Cities */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Cidades com mais denúncias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topCities} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
