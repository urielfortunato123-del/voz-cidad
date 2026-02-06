import { Heart, Construction, GraduationCap, Building, TreePine, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ICONS = {
  SAUDE: Heart,
  OBRAS: Construction,
  EDUCACAO: GraduationCap,
  SERVICOS_URBANOS: Building,
  MEIO_AMBIENTE: TreePine,
  SEGURANCA: Shield,
  CORRUPCAO: AlertTriangle,
};

const COLORS: Record<CategoryKey, string> = {
  SAUDE: 'bg-category-saude/15 text-category-saude border-category-saude/30',
  OBRAS: 'bg-category-obras/15 text-category-obras border-category-obras/30',
  EDUCACAO: 'bg-category-educacao/15 text-category-educacao border-category-educacao/30',
  SERVICOS_URBANOS: 'bg-category-servicos/15 text-category-servicos border-category-servicos/30',
  MEIO_AMBIENTE: 'bg-category-ambiente/15 text-category-ambiente border-category-ambiente/30',
  SEGURANCA: 'bg-category-seguranca/15 text-category-seguranca border-category-seguranca/30',
  CORRUPCAO: 'bg-category-corrupcao/15 text-category-corrupcao border-category-corrupcao/30',
};

interface CategoryTagProps {
  category: CategoryKey;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function CategoryTag({ category, showIcon = true, size = 'md', className, animated = true }: CategoryTagProps) {
  const Icon = ICONS[category];
  const categoryInfo = CATEGORIES[category];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const content = (
    <>
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {categoryInfo?.label || category}
    </>
  );

  if (!animated) {
    return (
      <span 
        className={cn(
          'inline-flex items-center rounded-full font-medium border transition-all duration-200',
          COLORS[category],
          sizeClasses[size],
          className
        )}
      >
        {content}
      </span>
    );
  }
  
  return (
    <motion.span 
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        COLORS[category],
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {content}
    </motion.span>
  );
}
