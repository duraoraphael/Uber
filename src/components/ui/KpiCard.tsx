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
    gradient: 'from-emerald-500/15 to-emerald-500/5',
    border: 'border-emerald-500/25',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    glow: 'shadow-emerald-500/5',
  },
  red: {
    gradient: 'from-red-500/15 to-red-500/5',
    border: 'border-red-500/25',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/5',
  },
  amber: {
    gradient: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-500/25',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/5',
  },
  blue: {
    gradient: 'from-blue-500/15 to-blue-500/5',
    border: 'border-blue-500/25',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
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
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br transition-all shadow-lg',
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
            'text-slate-400 truncate font-medium uppercase tracking-wider',
            compact ? 'text-[10px] sm:text-[11px] mb-1' : 'text-[11px] sm:text-xs mb-1.5',
          )}>{title}</p>
          <p className={cn(
            'font-extrabold text-white truncate leading-tight',
            compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl lg:text-3xl',
          )}>{value}</p>
          {extra && <div className="mt-0.5">{extra}</div>}
        </div>
      </div>
    </Wrapper>
  );
}
