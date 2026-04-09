import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-6',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('mb-3 sm:mb-4 text-sm sm:text-[15px] font-semibold text-slate-100', className)}>
      {children}
    </h3>
  );
}
