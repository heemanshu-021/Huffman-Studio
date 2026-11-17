import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate';
  icon?: React.ReactNode;
  className?: string;
}

const accentClasses = {
  emerald: 'text-emerald-400',
  indigo: 'text-indigo-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-200',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  accent = 'slate',
  icon,
  className = '',
}) => {
  return (
    <div
      className={`p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">
          {label}
        </span>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <p className={`text-xl font-mono font-bold leading-none ${accentClasses[accent]}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-500 leading-none">{sub}</p>}
    </div>
  );
};
