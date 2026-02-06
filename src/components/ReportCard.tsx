import { useNavigate } from 'react-router-dom';
import { Calendar, ThumbsUp, User, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryTag } from './CategoryTag';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import type { Report } from '@/hooks/useReports';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  report: Report;
  className?: string;
  index?: number;
}

export function ReportCard({ report, className, index = 0 }: ReportCardProps) {
  const navigate = useNavigate();
  
  const displayTitle = report.title || report.description.substring(0, 60) + (report.description.length > 60 ? '...' : '');
  
  const authorDisplay = report.is_anonymous 
    ? 'Anônima' 
    : (report.show_name_publicly && report.author_name 
        ? report.author_name 
        : 'Identificada (privado)');
  
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
        className={cn(
          'card-interactive group',
          className
        )}
        onClick={() => navigate(`/denuncia/${report.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <CategoryTag category={report.category} size="sm" />
            <StatusBadge status={report.status} />
          </div>
          
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {displayTitle}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(report.created_at), "dd/MM/yy", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              {report.is_anonymous ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              <span className="truncate max-w-[120px]">{authorDisplay}</span>
            </div>
            
            {report.confirmations_count > 0 && (
              <motion.div 
                className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-md font-medium"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{report.confirmations_count}</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
