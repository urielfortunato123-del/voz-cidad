import { useNavigate } from 'react-router-dom';
import { Calendar, ThumbsUp, User, EyeOff } from 'lucide-react';
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
}

export function ReportCard({ report, className }: ReportCardProps) {
  const navigate = useNavigate();
  
  const displayTitle = report.title || report.description.substring(0, 60) + (report.description.length > 60 ? '...' : '');
  
  const authorDisplay = report.is_anonymous 
    ? 'Anônima' 
    : (report.show_name_publicly && report.author_name 
        ? report.author_name 
        : 'Identificada (privado)');
  
  return (
    <Card 
      className={cn('card-elevated cursor-pointer active:scale-[0.98] transition-transform', className)}
      onClick={() => navigate(`/denuncia/${report.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CategoryTag category={report.category} size="sm" />
          <StatusBadge status={report.status} />
        </div>
        
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {displayTitle}
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(report.created_at), "dd/MM/yy", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {report.is_anonymous ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            <span>{authorDisplay}</span>
          </div>
          
          {report.confirmations_count > 0 && (
            <div className="flex items-center gap-1 text-primary">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{report.confirmations_count}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
