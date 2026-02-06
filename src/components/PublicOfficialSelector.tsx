import { useState, useMemo } from 'react';
import { Search, User, Building2, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePublicOfficials, PublicOfficial } from '@/hooks/usePublicOfficials';
import { cn } from '@/lib/utils';

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
  
  const { data: officials = [], isLoading, error } = usePublicOfficials({
    uf,
    city,
    category,
  });

  // Group officials by scope
  const groupedOfficials = useMemo(() => {
    const filtered = officials.filter(off => 
      off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.role_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.party?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, PublicOfficial[]> = {
      'MUNICIPAL': [],
      'ESTADUAL': [],
      'FEDERAL': [],
    };

    filtered.forEach(off => {
      if (groups[off.scope]) {
        groups[off.scope].push(off);
      }
    });

    return groups;
  }, [officials, searchTerm]);

  const totalOfficials = officials.length;
  const hasOfficials = totalOfficials > 0;

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
              'w-full justify-between h-auto py-3 px-4',
              selectedOfficial && 'border-primary/50 bg-primary/5'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                selectedOfficial ? 'bg-primary/10' : 'bg-muted'
              )}>
                {selectedOfficial?.photo_url ? (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedOfficial.photo_url} alt={selectedOfficial.name} />
                    <AvatarFallback>{selectedOfficial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-left">
                {selectedOfficial ? (
                  <>
                    <p className="font-medium text-sm">{selectedOfficial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOfficial.role_label} {selectedOfficial.party && `• ${selectedOfficial.party}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm">Direcionar para político (opcional)</p>
                    <p className="text-xs text-muted-foreground">
                      {isLoading ? 'Carregando...' : hasOfficials ? `${totalOfficials} políticos encontrados` : 'Nenhum político encontrado'}
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
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <ChevronDown className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )} />
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg bg-card shadow-lg">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cargo ou partido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Officials list */}
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Buscando políticos...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-destructive">
                  Erro ao carregar políticos. Tente novamente.
                </div>
              ) : !hasOfficials ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum político encontrado para esta localidade.</p>
                  <p className="text-sm mt-1">Os dados serão atualizados em breve.</p>
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
                              key={official.external_id}
                              type="button"
                              onClick={() => {
                                onSelect(official);
                                setIsOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                                'hover:bg-accent',
                                selectedOfficial?.external_id === official.external_id && 'bg-primary/10'
                              )}
                            >
                              <Avatar className="w-10 h-10 border">
                                <AvatarImage src={official.photo_url || undefined} alt={official.name} />
                                <AvatarFallback className="text-xs">
                                  {official.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{official.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {official.role_label}
                                  {official.party && ` • ${official.party}`}
                                </p>
                              </div>
                              {selectedOfficial?.external_id === official.external_id && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
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
