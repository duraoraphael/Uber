import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: 'emerald' | 'red' | 'amber' | 'blue';
  compact?: boolean;
  onClick?: () => void;
  className?: string;
  extra?: ReactNode;
}

const colorStyles = {
  emerald: {
    gradient: 'from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/5',
    border: 'border-emerald-500/20 dark:border-emerald-500/25',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/5',
  },
  red: {
    gradient: 'from-red-500/10 to-red-500/5 dark:from-red-500/15 dark:to-red-500/5',
    border: 'border-red-500/20 dark:border-red-500/25',
    iconBg: 'bg-red-500/10 dark:bg-red-500/15',
    iconColor: 'text-red-600 dark:text-red-400',
    glow: 'shadow-red-500/5',
  },
  amber: {
    gradient: 'from-amber-500/10 to-amber-500/5 dark:from-amber-500/15 dark:to-amber-500/5',
    border: 'border-amber-500/20 dark:border-amber-500/25',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/5',
  },
  blue: {
    gradient: 'from-blue-500/10 to-blue-500/5 dark:from-blue-500/15 dark:to-blue-500/5',
    border: 'border-blue-500/20 dark:border-blue-500/25',
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    iconColor: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/5',
  },
};

export function KpiCard({ title, value, icon, color = 'emerald', compact, onClick, className, extra }: KpiCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const s = colorStyles[color];

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br transition-all shadow-md',
        'bg-white/70 dark:bg-transparent',
        s.gradient, s.border, s.glow,
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6',
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex shrink-0 items-center justify-center rounded-xl',
          compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-12 sm:w-12',
          s.iconBg, s.iconColor,
        )}>
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <p className={cn(
            'truncate font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
            compact ? 'text-[10px] sm:text-[11px] mb-1' : 'text-[11px] sm:text-xs mb-1.5',
          )}>{title}</p>
          <p className={cn(
            'font-extrabold truncate leading-tight text-slate-900 dark:text-white',
            compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl lg:text-3xl',
          )}>{value}</p>
          {extra && <div className="mt-0.5">{extra}</div>}
        </div>
      </div>
    </Wrapper>
  );
}
