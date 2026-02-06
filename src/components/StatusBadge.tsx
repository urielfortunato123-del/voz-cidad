import { motion } from 'framer-motion';
import { STATUSES, type StatusKey } from '@/lib/constants';
import { cn } from '@/lib/utils';

const COLORS: Record<StatusKey, string> = {
  RECEBIDA: 'bg-status-recebida/15 text-status-recebida',
  EM_ANALISE: 'bg-status-analise/15 text-status-analise',
  ENCAMINHADA: 'bg-status-encaminhada/15 text-status-encaminhada',
  RESPONDIDA: 'bg-status-respondida/15 text-status-respondida',
  RESOLVIDA: 'bg-status-resolvida/15 text-status-resolvida',
  ARQUIVADA: 'bg-status-arquivada/15 text-status-arquivada',
  SOB_REVISAO: 'bg-status-revisao/15 text-status-revisao',
};

interface StatusBadgeProps {
  status: StatusKey;
  className?: string;
  animated?: boolean;
}

export function StatusBadge({ status, className, animated = true }: StatusBadgeProps) {
  const statusInfo = STATUSES[status];
  
  if (!animated) {
    return (
      <span 
        className={cn(
          'status-badge transition-all duration-200',
          COLORS[status],
          className
        )}
      >
        {statusInfo?.label || status}
      </span>
    );
  }
  
  return (
    <motion.span 
      className={cn(
        'status-badge',
        COLORS[status],
        className
      )}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {statusInfo?.label || status}
    </motion.span>
  );
}
