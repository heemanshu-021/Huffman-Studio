import React from 'react';

type BadgeVariant = 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  slate: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
};

const dotClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-400',
  indigo: 'bg-indigo-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  slate: 'bg-slate-400',
  purple: 'bg-purple-400',
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
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border
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
