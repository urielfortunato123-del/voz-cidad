import { Mail, ExternalLink, Copy, Building2, Landmark, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AGENCY_SCOPES } from '@/lib/constants';
import { copyToClipboard } from '@/lib/email';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Agency } from '@/hooks/useAgencies';

interface AgencyCardProps {
  agency: Agency;
  onSelect: (agency: Agency) => void;
  className?: string;
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

export function AgencyCard({ agency, onSelect, className }: AgencyCardProps) {
  const ScopeIcon = SCOPE_ICONS[agency.scope];
  
  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await copyToClipboard(agency.email);
      toast.success('E-mail copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };
  
  return (
    <Card 
      className={cn('card-elevated cursor-pointer active:scale-[0.98] transition-transform', className)}
      onClick={() => onSelect(agency)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', SCOPE_COLORS[agency.scope])}>
            <ScopeIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {AGENCY_SCOPES[agency.scope]}
            </span>
            <h3 className="font-semibold text-foreground mt-0.5 line-clamp-2">
              {agency.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{agency.email}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={handleCopyEmail}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
