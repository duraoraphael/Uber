import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/20',
  secondary:
    'border bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 border-gray-200 ' +
    'dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 dark:text-slate-100 dark:border-slate-700',
  danger:
    'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 ' +
    'dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20',
  ghost:
    'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 ' +
    'dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:text-slate-300',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm sm:px-5 rounded-xl',
  lg: 'px-6 py-3 text-sm sm:px-7 sm:py-3.5 rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        'active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1',
        'min-h-[44px] sm:min-h-[40px]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
