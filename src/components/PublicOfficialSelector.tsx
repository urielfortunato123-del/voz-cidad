import { useState, useMemo } from 'react';
import { Search, User, Building2, ChevronDown, Check, X, Loader2, Mail, Phone, Plus, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export interface PublicOfficial {
  id: string;
  external_id: string;
  name: string;
  role: string;
  role_label: string;
  photo_url: string | null;
  party: string | null;
  uf: string;
  city: string | null;
  category_tags: string[];
  scope: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  email: string | null;
  phone: string | null;
}

interface PublicOfficialSelectorProps {
  uf: string | null;
  city: string | null;
  category: string | null;
  selectedOfficial: PublicOfficial | null;
  onSelect: (official: PublicOfficial | null) => void;
  className?: string;
}

const SCOPE_LABELS: Record<string, string> = {
  'MUNICIPAL': 'Municipal',
  'ESTADUAL': 'Estadual',
  'FEDERAL': 'Federal',
};

const SCOPE_COLORS: Record<string, string> = {
  'MUNICIPAL': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'ESTADUAL': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'FEDERAL': 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const ROLE_LABELS: Record<string, string> = {
  'VEREADOR': 'Vereador(a)',
  'PREFEITO': 'Prefeito(a)',
  'DEPUTADO_ESTADUAL': 'Deputado(a) Estadual',
  'DEPUTADO_FEDERAL': 'Deputado(a) Federal',
  'SENADOR': 'Senador(a)',
  'GOVERNADOR': 'Governador(a)',
  'SECRETARIO_SAUDE': 'Secretário(a) de Saúde',
  'SECRETARIO_EDUCACAO': 'Secretário(a) de Educação',
  'SECRETARIO_OBRAS': 'Secretário(a) de Obras',
  'SECRETARIO_SERVICOS_URBANOS': 'Secretário(a) de Serviços Urbanos',
  'SECRETARIO_MEIO_AMBIENTE': 'Secretário(a) de Meio Ambiente',
  'SECRETARIO_SEGURANCA': 'Secretário(a) de Segurança',
  'MINISTRO_SAUDE': 'Ministro(a) da Saúde',
  'MINISTRO_EDUCACAO': 'Ministro(a) da Educação',
  'MINISTRO_MEIO_AMBIENTE': 'Ministro(a) do Meio Ambiente',
  'MINISTRO_JUSTICA': 'Ministro(a) da Justiça',
  'PRESIDENTE': 'Presidente',
};

const MUNICIPAL_ROLES = ['PREFEITO', 'VEREADOR', 'SECRETARIO_SAUDE', 'SECRETARIO_EDUCACAO', 'SECRETARIO_OBRAS', 'SECRETARIO_SERVICOS_URBANOS', 'SECRETARIO_MEIO_AMBIENTE', 'SECRETARIO_SEGURANCA'];
const ESTADUAL_ROLES = ['GOVERNADOR', 'DEPUTADO_ESTADUAL'];
const FEDERAL_ROLES = ['PRESIDENTE', 'SENADOR', 'DEPUTADO_FEDERAL'];

export function PublicOfficialSelector({
  uf,
  city,
  category,
  selectedOfficial,
  onSelect,
  className,
}: PublicOfficialSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOfficialName, setNewOfficialName] = useState('');
  const [newOfficialRole, setNewOfficialRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch officials from database directly
  const { data: officials = [], isLoading, error, refetch } = useQuery({
    queryKey: ['public-officials-direct', uf, city],
    queryFn: async (): Promise<PublicOfficial[]> => {
      if (!uf) return [];

      // Fetch from public_officials table directly
      let query = supabase
        .from('public_officials')
        .select('*')
        .eq('uf', uf)
        .eq('active', true);

      // Include both city-specific and state-wide officials
      if (city) {
        query = query.or(`city.eq.${city},city.is.null`);
      }

      const { data, error } = await query
        .order('scope')
        .order('role')
        .order('name');

      if (error) {
        console.error('Erro ao buscar políticos:', error);
        throw error;
      }

      return (data || []).map(off => ({
        ...off,
        role_label: ROLE_LABELS[off.role] || off.role,
        scope: off.scope as 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL',
      }));
    },
    enabled: !!uf,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Group officials by scope - prioritize city officials when city is selected
  const groupedOfficials = useMemo(() => {
    let filtered = officials;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(off => 
        off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ROLE_LABELS[off.role]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.party?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const groups: Record<string, PublicOfficial[]> = {
      'MUNICIPAL': [],
      'ESTADUAL': [],
      'FEDERAL': [],
    };

    filtered.forEach(off => {
      if (groups[off.scope]) {
        // For municipal, only show officials from the selected city
        if (off.scope === 'MUNICIPAL') {
          if (city && off.city === city) {
            groups[off.scope].push(off);
          }
        } else {
          groups[off.scope].push(off);
        }
      }
    });

    return groups;
  }, [officials, searchTerm, city]);

  const totalOfficials = officials.length;
  const hasOfficials = totalOfficials > 0;

  // Handle adding a new official
  const handleAddOfficial = async () => {
    if (!newOfficialName.trim() || !newOfficialRole || !uf) return;

    setIsCreating(true);

    try {
      // Determine scope based on role
      let scope: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL' = 'MUNICIPAL';
      if (ESTADUAL_ROLES.includes(newOfficialRole)) scope = 'ESTADUAL';
      if (FEDERAL_ROLES.includes(newOfficialRole)) scope = 'FEDERAL';

      const { data, error } = await supabase
        .from('public_officials')
        .insert({
          external_id: `MANUAL_${Date.now()}`,
          name: newOfficialName.trim(),
          role: newOfficialRole,
          uf: uf,
          city: MUNICIPAL_ROLES.includes(newOfficialRole) ? city : null,
          scope: scope,
          category_tags: category ? [category] : [],
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Select the newly created official
      const newOfficial: PublicOfficial = {
        ...data,
        role_label: ROLE_LABELS[data.role] || data.role,
        scope: data.scope as 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL',
      };

      onSelect(newOfficial);
      setShowAddForm(false);
      setNewOfficialName('');
      setNewOfficialRole('');
      setIsOpen(false);
      refetch();
    } catch (err) {
      console.error('Erro ao adicionar político:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Get available roles based on city/uf
  const availableRoles = useMemo(() => {
    const roles: { value: string; label: string; scope: string }[] = [];
    
    // Always add federal roles
    FEDERAL_ROLES.forEach(role => {
      roles.push({ value: role, label: ROLE_LABELS[role], scope: 'FEDERAL' });
    });
    
    // Always add state roles
    ESTADUAL_ROLES.forEach(role => {
      roles.push({ value: role, label: ROLE_LABELS[role], scope: 'ESTADUAL' });
    });
    
    // Add municipal roles if city is selected
    if (city) {
      MUNICIPAL_ROLES.forEach(role => {
        roles.push({ value: role, label: ROLE_LABELS[role], scope: 'MUNICIPAL' });
      });
    }
    
    return roles;
  }, [city]);

  if (!uf) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={cn(
              'w-full justify-between h-auto py-3 px-4 transition-all duration-300',
              selectedOfficial && 'border-primary/50 bg-gradient-to-r from-primary/5 to-transparent',
              !selectedOfficial && 'hover:border-primary/30 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300',
                selectedOfficial 
                  ? 'bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/20' 
                  : 'bg-muted'
              )}>
                {selectedOfficial?.photo_url ? (
                  <Avatar className="w-11 h-11 ring-2 ring-background">
                    <AvatarImage src={selectedOfficial.photo_url} alt={selectedOfficial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{selectedOfficial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-left">
                {selectedOfficial ? (
                  <>
                    <p className="font-semibold text-sm text-foreground">{selectedOfficial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOfficial.role_label} {selectedOfficial.party && `• ${selectedOfficial.party}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm">Direcionar para político (opcional)</p>
                    <p className="text-xs text-muted-foreground">
                      {isLoading ? 'Carregando...' : hasOfficials ? `${totalOfficials} políticos encontrados` : 'Clique para adicionar'}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedOfficial && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <ChevronDown className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-300',
                isOpen && 'rotate-180'
              )} />
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 animate-fade-in">
          <div className="border border-border/40 rounded-xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            {/* Search and Add Button */}
            <div className="p-3 border-b border-border/40 bg-muted/30 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cargo ou partido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              
              {!showAddForm && (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-center gap-2 border-dashed"
                  onClick={() => setShowAddForm(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Adicionar político manualmente
                </Button>
              )}
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="p-3 border-b border-border/40 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <UserPlus className="h-4 w-4" />
                  Adicionar novo político
                </div>
                
                <Input
                  placeholder="Nome do político (ex: Suellen Silva)"
                  value={newOfficialName}
                  onChange={(e) => setNewOfficialName(e.target.value)}
                  className="bg-background"
                />
                
                <Select value={newOfficialRole} onValueChange={setNewOfficialRole}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {city && (
                      <>
                        <SelectItem value="PREFEITO" className="text-blue-600">
                          🏛️ Prefeito(a) de {city}
                        </SelectItem>
                        <SelectItem value="VEREADOR">Vereador(a)</SelectItem>
                        <SelectItem value="SECRETARIO_SAUDE">Secretário(a) de Saúde</SelectItem>
                        <SelectItem value="SECRETARIO_EDUCACAO">Secretário(a) de Educação</SelectItem>
                        <SelectItem value="SECRETARIO_OBRAS">Secretário(a) de Obras</SelectItem>
                      </>
                    )}
                    <SelectItem value="GOVERNADOR" className="text-amber-600">
                      🏛️ Governador(a) de {uf}
                    </SelectItem>
                    <SelectItem value="DEPUTADO_ESTADUAL">Deputado(a) Estadual</SelectItem>
                    <SelectItem value="DEPUTADO_FEDERAL">Deputado(a) Federal</SelectItem>
                    <SelectItem value="SENADOR">Senador(a)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Preview do político sendo adicionado */}
                {newOfficialName.trim() && newOfficialRole && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-2">Prévia:</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-11 h-11 border-2 border-background ring-1 ring-primary/30">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {newOfficialName.trim().split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-primary">{newOfficialName.trim()}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ROLE_LABELS[newOfficialRole]}
                          {MUNICIPAL_ROLES.includes(newOfficialRole) && city && ` • ${city}`}
                          {ESTADUAL_ROLES.includes(newOfficialRole) && uf && ` • ${uf}`}
                        </p>
                        <Badge variant="outline" className={cn(
                          'mt-1 text-xs',
                          MUNICIPAL_ROLES.includes(newOfficialRole) && SCOPE_COLORS['MUNICIPAL'],
                          ESTADUAL_ROLES.includes(newOfficialRole) && SCOPE_COLORS['ESTADUAL'],
                          FEDERAL_ROLES.includes(newOfficialRole) && SCOPE_COLORS['FEDERAL']
                        )}>
                          {MUNICIPAL_ROLES.includes(newOfficialRole) && 'Municipal'}
                          {ESTADUAL_ROLES.includes(newOfficialRole) && 'Estadual'}
                          {FEDERAL_ROLES.includes(newOfficialRole) && 'Federal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewOfficialName('');
                      setNewOfficialRole('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={!newOfficialName.trim() || !newOfficialRole || isCreating}
                    onClick={handleAddOfficial}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Officials list */}
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Buscando políticos...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-destructive mb-2">Erro ao carregar políticos.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : !hasOfficials && !showAddForm ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum político cadastrado para esta localidade.</p>
                  <p className="text-sm mt-1">Use o botão acima para adicionar.</p>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {Object.entries(groupedOfficials).map(([scope, scopeOfficials]) => {
                    if (scopeOfficials.length === 0) return null;
                    
                    return (
                      <div key={scope}>
                        <div className="px-2 py-1 mb-2">
                          <Badge variant="outline" className={SCOPE_COLORS[scope]}>
                            {SCOPE_LABELS[scope]} ({scopeOfficials.length})
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {scopeOfficials.map((official) => (
                            <button
                              key={official.id}
                              type="button"
                              onClick={() => {
                                onSelect(official);
                                setIsOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-left group/item',
                                'hover:bg-gradient-to-r hover:from-accent/80 hover:to-transparent',
                                selectedOfficial?.id === official.id && 'bg-primary/10 ring-1 ring-primary/20'
                              )}
                            >
                              <Avatar className="w-11 h-11 border-2 border-background ring-1 ring-border/40 group-hover/item:ring-primary/30 transition-all duration-200">
                                <AvatarImage src={official.photo_url || undefined} alt={official.name} />
                                <AvatarFallback className="text-xs bg-muted font-medium">
                                  {official.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate group-hover/item:text-primary transition-colors">{official.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {official.role_label}
                                  {official.city && ` • ${official.city}`}
                                  {official.party && ` • ${official.party}`}
                                </p>
                                {/* Contact indicators */}
                                <div className="flex items-center gap-2 mt-1">
                                  {official.email && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-xs text-primary/70">
                                            <Mail className="h-3 w-3" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{official.email}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {official.phone && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center gap-1 text-xs text-primary/70">
                                            <Phone className="h-3 w-3" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{official.phone}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                              {selectedOfficial?.id === official.id && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
