import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'rounded-xl border px-3 py-3 text-sm outline-none transition-all',
          'bg-gray-50 border-gray-200 text-slate-900 placeholder:text-gray-400',
          'dark:bg-slate-950 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder:text-slate-600',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white',
          'dark:focus:border-emerald-500/60 dark:focus:ring-emerald-500/20 dark:focus:bg-slate-900',
          'min-h-[44px] sm:min-h-[40px]',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50',
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</span>
      )}
    </div>
  );
}
