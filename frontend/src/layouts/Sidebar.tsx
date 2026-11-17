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
} from 'lucide-react';
import { HealthStatus } from '../hooks/useHealthCheck';

interface SidebarProps {
  healthStatus: HealthStatus;
  version?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/compress', label: 'Compressor', icon: FileArchive },
  { to: '/decompress', label: 'Decompressor', icon: FileText },
  { to: '/visualizer', label: 'Tree Visualizer', icon: Network },
  { to: '/how-it-works', label: 'How It Works', icon: BookOpen },
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
      ? 'bg-emerald-400'
      : healthStatus === 'CHECKING'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-rose-400';

  const statusLabel =
    healthStatus === 'UP' ? 'Backend Online' : healthStatus === 'CHECKING' ? 'Connecting…' : 'Backend Offline';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-[#0d0d14] border-r border-[#1e1e2e]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[60px]' : 'w-[220px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0
        `}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-[#1e1e2e] ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Binary className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-sm font-bold text-slate-100 leading-none tracking-tight truncate">
                Huffman Studio
              </p>
              <p className="text-[9px] uppercase font-mono tracking-widest text-emerald-500 mt-0.5">
                Compression Suite
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto" aria-label="Sidebar navigation">
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
                  flex items-center gap-3 rounded-lg transition-all duration-150 group
                  ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
                  ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: status + collapse */}
        <div className="border-t border-[#1e1e2e] p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1 py-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
              <span className="text-xs text-slate-400 truncate">{statusLabel}</span>
              {version && (
                <span className="ml-auto text-[10px] font-mono text-slate-600">v{version}</span>
              )}
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} title={statusLabel} />
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors text-xs"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
