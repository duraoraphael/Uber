import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'rounded-xl border px-4 py-3 text-sm outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all',
          'bg-gray-50 border-gray-300/80 text-slate-900 placeholder:text-gray-400',
          'dark:bg-slate-950 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder:text-slate-600',
          'min-h-[44px] sm:min-h-[40px]',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
