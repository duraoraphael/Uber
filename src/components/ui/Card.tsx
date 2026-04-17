import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-2xl border backdrop-blur-sm',
      'bg-white/90 border-gray-200/80 dark:bg-slate-900/80 dark:border-slate-800/80',
      'p-4 sm:p-5 md:p-6 lg:p-6',
      'shadow-sm hover:shadow-md transition-shadow duration-200',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn(
      'mb-3 sm:mb-4 text-base sm:text-lg md:text-xl font-bold leading-tight',
      'text-slate-900 dark:text-white',
      className
    )}>
      {children}
    </h3>
  );
}
