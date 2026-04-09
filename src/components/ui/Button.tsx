import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.97]',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
