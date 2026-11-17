import React from 'react';
import { HealthStatus } from '../hooks/useHealthCheck';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: HealthStatus;
  version?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, version }) => {
  if (status === 'CHECKING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
        <Activity className="w-3.5 h-3.5 animate-spin" />
        Checking API...
      </span>
    );
  }

  if (status === 'UP') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <CheckCircle2 className="w-3.5 h-3.5" />
        Java 21 Backend Online {version && `(v${version})`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
      <XCircle className="w-3.5 h-3.5" />
      Backend Offline (Port 8080)
    </span>
  );
};
