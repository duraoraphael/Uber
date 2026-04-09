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
}

const colorStyles = {
  emerald: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  red: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
};

export function KpiCard({ title, value, icon, color = 'emerald', compact, onClick, className }: KpiCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const s = colorStyles[color];

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 border-l-4 transition-all',
        s.border,
        compact ? 'p-3 sm:p-4' : 'p-3.5 sm:p-5',
        onClick && 'cursor-pointer hover:bg-slate-800/80 active:scale-[0.97]',
        className,
      )}
    >
      <div className={cn(
        'flex shrink-0 items-center justify-center rounded-lg sm:rounded-xl',
        compact ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10',
        s.iconBg, s.iconColor,
      )}>
        {icon}
      </div>
      <div className="min-w-0 text-left space-y-0.5">
        <p className={cn(
          'text-slate-400 truncate',
          compact ? 'text-[10px] sm:text-[11px]' : 'text-[10px] sm:text-xs font-medium uppercase tracking-wider',
        )}>{title}</p>
        <p className={cn(
          'font-bold text-white truncate',
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg lg:text-xl',
        )}>{value}</p>
      </div>
    </Wrapper>
  );
}
