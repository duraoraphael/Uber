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
      'bg-white border-gray-200/70 shadow-sm hover:shadow-md',
      'dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-none dark:hover:shadow-none',
      'p-4 sm:p-5 md:p-6',
      'transition-shadow duration-200',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn(
      'mb-3 sm:mb-4 text-base sm:text-lg font-bold leading-tight',
      'text-slate-800 dark:text-white',
      className,
    )}>
      {children}
    </h3>
  );
}
