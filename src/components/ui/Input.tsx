import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'rounded-xl border px-3 py-3 text-sm outline-none transition-all',
          'bg-gray-50 border-gray-300/80 text-slate-900 placeholder:text-gray-400',
          'dark:bg-slate-950 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder:text-slate-600',
          'focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20',
          'min-h-[44px] sm:min-h-[40px]',
          error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-400 mt-1">{error}</span>
      )}
    </div>
  );
}
