import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'cyan';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/40 border border-emerald-400/20 disabled:opacity-50 disabled:shadow-none',
  secondary:
    'bg-surface-2 hover:bg-surface-3 text-slate-200 border border-surface-border hover:border-slate-600/60 shadow-sm disabled:opacity-40',
  cyan:
    'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/40 border border-cyan-400/20 disabled:opacity-50',
  ghost:
    'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent disabled:opacity-40',
  danger:
    'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 hover:border-rose-700/60 disabled:opacity-40',
  outline:
    'bg-emerald-500/5 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 disabled:opacity-40',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-xs font-medium gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm font-medium gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base font-semibold gap-2.5 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center transition-all duration-150 select-none
        active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
