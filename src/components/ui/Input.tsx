import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'rounded-lg sm:rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all',
          className,
        )}
        {...props}
      />
    </div>
  );
}
