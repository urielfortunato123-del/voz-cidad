import { Mail, ExternalLink, Copy, Building2, Landmark, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
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
  index?: number;
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

export function AgencyCard({ agency, onSelect, className, index = 0 }: AgencyCardProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        delay: index * 0.05 
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn('card-interactive group', className)}
        onClick={() => onSelect(agency)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <motion.div 
              className={cn('p-2 rounded-lg transition-colors duration-200', SCOPE_COLORS[agency.scope])}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <ScopeIcon className="h-5 w-5" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {AGENCY_SCOPES[agency.scope]}
              </span>
              <h3 className="font-semibold text-foreground mt-0.5 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {agency.name}
              </h3>
              
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{agency.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                  onClick={handleCopyEmail}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <motion.div
              animate={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200 flex-shrink-0" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
