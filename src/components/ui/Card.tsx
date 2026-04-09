import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 sm:p-5 lg:p-6 backdrop-blur-sm',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('mb-3 sm:mb-4 text-base sm:text-lg font-bold text-white', className)}>
      {children}
    </h3>
  );
}
