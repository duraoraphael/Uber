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
        <label
          htmlFor={id}
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'rounded-xl border px-4 py-3 text-sm outline-none transition-all appearance-none',
          'bg-gray-50 border-gray-200 text-slate-900',
          'dark:bg-slate-950 dark:border-slate-700/80 dark:text-slate-100',
          'focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20',
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
