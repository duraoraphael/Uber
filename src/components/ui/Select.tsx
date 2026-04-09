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
        <label htmlFor={id} className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all',
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
