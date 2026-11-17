import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 flex flex-col items-center text-center space-y-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
