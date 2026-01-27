import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryTag } from '@/components/CategoryTag';
import { StatusBadge } from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, STATUSES, type CategoryKey, type StatusKey } from '@/lib/constants';

const PAGE_SIZE = 20;

export default function AdminReports() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page, categoryFilter, statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      
      if (search) {
        query = query.or(`protocol.ilike.%${search}%,description.ilike.%${search}%,title.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { reports: data || [], total: count || 0 };
    },
  });
  
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Denúncias</h1>
        <p className="text-muted-foreground">Gerenciar todas as denúncias</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por protocolo, título ou descrição..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.reports.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.reports.map((report) => (
              <Card key={report.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold">{report.protocol}</span>
                        <CategoryTag category={report.category as CategoryKey} size="sm" />
                        <StatusBadge status={report.status as StatusKey} />
                      </div>
                      <p className="text-sm truncate">
                        {report.title || report.description.substring(0, 80) + '...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.city}/{report.uf} • {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        {report.flags_count > 0 && (
                          <span className="text-destructive ml-2">• {report.flags_count} flags</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/denuncia/${report.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} denúncia{data.total !== 1 ? 's' : ''} encontrada{data.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {page + 1} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nenhuma denúncia encontrada</p>
        </div>
      )}
    </div>
  );
}
