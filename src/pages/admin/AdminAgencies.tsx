import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStates } from '@/hooks/useLocations';
import { CATEGORIES, AGENCY_SCOPES, type CategoryKey } from '@/lib/constants';
import { toast } from 'sonner';

type AgencyScope = 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';

interface AgencyForm {
  name: string;
  email: string;
  scope: AgencyScope;
  uf: string;
  city: string | null;
  category_tags: string[];
  active: boolean;
}

const emptyForm: AgencyForm = {
  name: '',
  email: '',
  scope: 'MUNICIPAL',
  uf: '',
  city: null,
  category_tags: [],
  active: true,
};

export default function AdminAgencies() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgencyForm>(emptyForm);
  
  const { data: states } = useStates();
  
  const { data: agencies, isLoading } = useQuery({
    queryKey: ['admin-agencies', scopeFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('agencies')
        .select('*')
        .order('name');
      
      if (scopeFilter !== 'all') {
        query = query.eq('scope', scopeFilter as 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL');
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data: AgencyForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('agencies')
          .update({
            name: data.name,
            email: data.email,
            scope: data.scope,
            uf: data.uf,
            city: data.scope === 'MUNICIPAL' ? data.city : null,
            category_tags: data.category_tags,
            active: data.active,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agencies')
          .insert({
            name: data.name,
            email: data.email,
            scope: data.scope,
            uf: data.uf,
            city: data.scope === 'MUNICIPAL' ? data.city : null,
            category_tags: data.category_tags,
            active: data.active,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      toast.success(editingId ? 'Órgão atualizado!' : 'Órgão criado!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      toast.success('Órgão excluído!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir');
    },
  });
  
  const handleOpenDialog = (agency?: typeof agencies extends (infer T)[] ? T : never) => {
    if (agency) {
      setEditingId(agency.id);
      setForm({
        name: agency.name,
        email: agency.email,
        scope: agency.scope as AgencyScope,
        uf: agency.uf,
        city: agency.city,
        category_tags: agency.category_tags || [],
        active: agency.active,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, id: editingId || undefined });
  };
  
  const toggleCategory = (category: string) => {
    setForm(prev => ({
      ...prev,
      category_tags: prev.category_tags.includes(category)
        ? prev.category_tags.filter(c => c !== category)
        : [...prev.category_tags, category],
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Órgãos Públicos</h1>
          <p className="text-muted-foreground">Gerenciar órgãos e e-mails</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Órgão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Órgão' : 'Novo Órgão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Esfera *</Label>
                <Select 
                  value={form.scope} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, scope: v as AgencyScope }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENCY_SCOPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Estado (UF) *</Label>
                <Select 
                  value={form.uf} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, uf: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {states?.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.name} ({state.uf})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.scope === 'MUNICIPAL' && (
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={form.city || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value || null }))}
                    placeholder="Nome da cidade"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Categorias atendidas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.category_tags.includes(key)}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, active: !!checked }))}
                />
                <span className="text-sm">Ativo</span>
              </label>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Esfera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas esferas</SelectItem>
            {Object.entries(AGENCY_SCOPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : agencies && agencies.length > 0 ? (
        <div className="space-y-3">
          {agencies.map((agency) => (
            <Card key={agency.id} className={`card-elevated ${!agency.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{agency.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                        {AGENCY_SCOPES[agency.scope as keyof typeof AGENCY_SCOPES]}
                      </span>
                      {!agency.active && (
                        <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{agency.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {agency.city ? `${agency.city}/` : ''}{agency.uf}
                      {agency.category_tags?.length > 0 && (
                        <span> • {agency.category_tags.length} categorias</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(agency)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Excluir este órgão?')) {
                          deleteMutation.mutate(agency.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Nenhum órgão encontrado</p>
        </div>
      )}
    </div>
  );
}
