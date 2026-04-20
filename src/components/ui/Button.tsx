import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20',
  secondary: 'border bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm sm:px-5 sm:py-2.5',
  lg: 'px-6 py-3 text-base sm:px-8 sm:py-4',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'min-h-[44px] sm:min-h-[40px]', // Touch-friendly height
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
