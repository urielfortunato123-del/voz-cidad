import { useEffect } from 'react';
import { Sparkles, Mail, Copy, Loader2, AlertCircle, Building2, Landmark, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGENCY_SCOPES } from '@/lib/constants';
import { copyToClipboard, openMailto, generateEmailContent } from '@/lib/email';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSuggestAgencies, type SuggestedAgency } from '@/hooks/useSuggestAgencies';
import type { CategoryKey } from '@/lib/constants';

interface AISuggestedAgenciesProps {
  uf: string;
  city: string;
  category: CategoryKey;
  reportData: {
    protocol: string;
    description: string;
    address_text?: string;
    lat?: number;
    lng?: number;
    author_name?: string;
    is_anonymous: boolean;
  };
  onHasSuggestions?: (has: boolean) => void;
}

const SCOPE_ICONS = {
  MUNICIPAL: Building2,
  ESTADUAL: Landmark,
  FEDERAL: Flag,
};

const SCOPE_COLORS = {
  MUNICIPAL: 'bg-primary/10 text-primary',
  ESTADUAL: 'bg-secondary/10 text-secondary',
  FEDERAL: 'bg-accent/20 text-accent-foreground',
};

export function AISuggestedAgencies({ 
  uf, 
  city, 
  category, 
  reportData,
  onHasSuggestions 
}: AISuggestedAgenciesProps) {
  const { suggestions, isLoading, error, fetchSuggestions } = useSuggestAgencies();

  useEffect(() => {
    if (uf && city && category) {
      fetchSuggestions(uf, city, category);
    }
  }, [uf, city, category]);

  useEffect(() => {
    onHasSuggestions?.(suggestions.length > 0);
  }, [suggestions, onHasSuggestions]);

  const handleCopyEmail = async (email: string) => {
    try {
      await copyToClipboard(email);
      toast.success('E-mail copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleOpenEmail = (agency: SuggestedAgency) => {
    const { subject, body } = generateEmailContent({
      protocol: reportData.protocol,
      uf,
      city,
      category,
      description: reportData.description,
      address_text: reportData.address_text,
      lat: reportData.lat,
      lng: reportData.lng,
      author_name: reportData.author_name,
      is_anonymous: reportData.is_anonymous,
    }, agency.email);
    
    openMailto(agency.email, subject, body);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Buscando órgãos para {city}/{uf}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchSuggestions(uf, city, category)}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Group by scope
  const groupedSuggestions = suggestions.reduce((acc, agency) => {
    if (!acc[agency.scope]) {
      acc[agency.scope] = [];
    }
    acc[agency.scope].push(agency);
    return acc;
  }, {} as Record<string, SuggestedAgency[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sugestões da IA
        </span>
        <Badge variant="secondary" className="text-xs">
          {suggestions.length} encontrados
        </Badge>
      </div>

      <div className="space-y-4">
        {(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'] as const).map((scope) => {
          const scopeAgencies = groupedSuggestions[scope];
          if (!scopeAgencies?.length) return null;

          return (
            <div key={scope}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {AGENCY_SCOPES[scope]}
              </h4>
              <div className="space-y-2">
                {scopeAgencies.map((agency, idx) => {
                  const ScopeIcon = SCOPE_ICONS[agency.scope];
                  
                  return (
                    <Card 
                      key={`${agency.email}-${idx}`}
                      className="card-elevated cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => handleOpenEmail(agency)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-lg', SCOPE_COLORS[agency.scope])}>
                            <ScopeIcon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground line-clamp-1">
                                {agency.name}
                              </h3>
                              {agency.confidence === 'alta' && (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                  ✓ Verificado
                                </Badge>
                              )}
                            </div>
                            
                            {agency.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {agency.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">{agency.email}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyEmail(agency.email);
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 Emails sugeridos pela IA com base em padrões oficiais
      </p>
    </div>
  );
}
