import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useHealthCheck } from '../hooks/useHealthCheck';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/compress': 'Compressor',
  '/decompress': 'Decompressor',
  '/visualizer': 'Tree Visualizer',
  '/how-it-works': 'How It Works',
};

export const MainLayout: React.FC = () => {
  const { status, data } = useHealthCheck(10000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] ?? 'Huffman Studio';

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-slate-200">
      <Sidebar
        healthStatus={status}
        version={data?.version}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 h-14 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-md">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-slate-200 truncate">{pageTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'UP'
                    ? 'bg-emerald-400 animate-pulse'
                    : status === 'CHECKING'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={
                  status === 'UP'
                    ? 'text-emerald-400'
                    : status === 'CHECKING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {status === 'UP' ? 'Backend Online' : status === 'CHECKING' ? 'Connecting' : 'Offline'}
              </span>
              {data?.version && (
                <span className="text-slate-500 font-mono">v{data.version}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
