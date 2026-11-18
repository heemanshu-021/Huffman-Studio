import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Binary,
  LayoutDashboard,
  FileArchive,
  FileText,
  Network,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { HealthStatus } from '../hooks/useHealthCheck';

interface SidebarProps {
  healthStatus: HealthStatus;
  version?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true, badge: 'Hub' },
  { to: '/compress', label: 'Compressor', icon: FileArchive, end: false },
  { to: '/decompress', label: 'Decompressor', icon: FileText, end: false },
  { to: '/visualizer', label: 'Tree Visualizer', icon: Network, end: false, badge: 'Live' },
  { to: '/how-it-works', label: 'How It Works', icon: BookOpen, end: false },
];

export const Sidebar: React.FC<SidebarProps> = ({
  healthStatus,
  version,
  mobileOpen,
  onMobileClose,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const statusColor =
    healthStatus === 'UP'
      ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
      : healthStatus === 'CHECKING'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]';

  const statusText =
    healthStatus === 'UP' ? 'Engine Online' : healthStatus === 'CHECKING' ? 'Connecting…' : 'Engine Offline';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-surface-0 border-r border-surface-border
          transition-all duration-300 ease-in-out select-none
          ${collapsed ? 'w-[68px]' : 'w-[236px]'}
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0
        `}
        aria-label="Main sidebar navigation"
      >
        {/* Brand Logo Header */}
        <div
          className={`flex items-center gap-3 px-4 py-4.5 border-b border-surface-border/80 h-16 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <div className="relative group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald group-hover:scale-105 transition-transform">
              <Binary className="w-4.5 h-4.5" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight truncate">
                  Huffman Studio
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase font-semibold leading-tight">
                Lossless Suite
              </p>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 space-y-1 px-2.5 overflow-y-auto" aria-label="Sidebar navigation links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl transition-all duration-150 group
                  ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-300 font-semibold border-l-2 border-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-l-2 border-transparent'
                  }
                `}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <span className="text-xs tracking-wide truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && !isActive && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-slate-400 border border-surface-border">
                    {item.badge}
                  </span>
                )}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: status + collapse button */}
        <div className="border-t border-surface-border p-3 space-y-2 bg-surface-0/60">
          {!collapsed ? (
            <div className="rounded-xl bg-surface-card border border-surface-border/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                  <span className="text-[11px] font-medium text-slate-300 truncate">
                    {statusText}
                  </span>
                </div>
                {version && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    v{version}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-surface-border/60">
                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  CRC-32 Validated
                </span>
                <span className="font-mono">HUFN v1</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2" title={`${statusText} (v${version || '1.0.0'})`}>
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors text-xs"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
