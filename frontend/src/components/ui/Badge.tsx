import React from 'react';

type BadgeVariant = 'emerald' | 'cyan' | 'indigo' | 'amber' | 'rose' | 'slate' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-sm shadow-emerald-950/20',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 shadow-sm shadow-cyan-950/20',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  slate: 'bg-surface-2 text-slate-300 border-surface-border',
  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
};

const dotClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-400 shadow-[0_0_6px_#10b981]',
  cyan: 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]',
  indigo: 'bg-indigo-400 shadow-[0_0_6px_#6366f1]',
  amber: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
  rose: 'bg-rose-400 shadow-[0_0_6px_#f43f5e]',
  slate: 'bg-slate-400',
  purple: 'bg-purple-400 shadow-[0_0_6px_#a855f7]',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className = '',
  dot = false,
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border
        backdrop-blur-sm transition-colors
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  );
};
