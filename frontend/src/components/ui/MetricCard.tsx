import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'emerald' | 'cyan' | 'indigo' | 'amber' | 'rose' | 'slate';
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

const accentValueColors = {
  emerald: 'text-emerald-400',
  cyan: 'text-cyan-400',
  indigo: 'text-indigo-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-100',
};

const accentTopGlow = {
  emerald: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  cyan: 'from-cyan-500/30 via-cyan-500/10 to-transparent',
  indigo: 'from-indigo-500/30 via-indigo-500/10 to-transparent',
  amber: 'from-amber-500/30 via-amber-500/10 to-transparent',
  rose: 'from-rose-500/30 via-rose-500/10 to-transparent',
  slate: 'from-slate-500/20 via-slate-500/5 to-transparent',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  accent = 'slate',
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-card/90 border border-surface-border p-4 shadow-glow-card transition-all duration-200 hover:border-slate-700/80 group ${className}`}
    >
      {/* Top subtle highlight gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentTopGlow[accent]} opacity-80 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
          {label}
        </span>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-400 group-hover:text-slate-200 transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className={`text-2xl font-mono font-bold tracking-tight ${accentValueColors[accent]}`}>
          {value}
        </p>
        <div className="flex items-center gap-2">
          {sub && <p className="text-[11px] text-slate-400 font-medium">{sub}</p>}
          {trend && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
