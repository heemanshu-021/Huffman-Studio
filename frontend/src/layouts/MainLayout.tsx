import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Github } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useHealthCheck } from '../hooks/useHealthCheck';

const pageMetadata: Record<string, { title: string; subtitle: string; category: string }> = {
  '/': {
    title: 'System Overview & Analytics',
    subtitle: 'Real-time performance, session metrics and engine diagnostics',
    category: 'Console',
  },
  '/compress': {
    title: 'Text File Compressor',
    subtitle: 'Transform UTF-8 plain text into bit-packed .huf binary archives',
    category: 'Encoding',
  },
  '/decompress': {
    title: 'Archive Decompressor',
    subtitle: 'Reconstruct original text with bit-for-bit CRC-32 integrity validation',
    category: 'Decoding',
  },
  '/visualizer': {
    title: 'Interactive Tree Visualizer',
    subtitle: 'Explore dynamic min-heap tree synthesis, prefix codes and bit-path tracing',
    category: 'Analysis',
  },
  '/how-it-works': {
    title: 'Algorithmic Foundation',
    subtitle: 'Complete theoretical and binary architecture walkthrough',
    category: 'Reference',
  },
};

export const MainLayout: React.FC = () => {
  const { status, data } = useHealthCheck(15000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const meta = pageMetadata[location.pathname] || {
    title: 'Huffman Studio',
    subtitle: 'Lossless text compression platform',
    category: 'Studio',
  };

  return (
    <div className="flex min-h-screen bg-surface text-slate-200">
      <Sidebar
        healthStatus={status}
        version={data?.version}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 h-16 border-b border-surface-border bg-surface-0/85 backdrop-blur-md">
          {/* Left section: mobile hamburger & breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-surface-border transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-surface-2 border border-surface-border">
                {meta.category}
              </span>
              <span className="hidden sm:inline-block text-slate-600">/</span>
              <h1 className="text-sm font-semibold text-slate-100 truncate">
                {meta.title}
              </h1>
            </div>
          </div>

          {/* Right section: System Status Pill & Links */}
          <div className="flex items-center gap-3">
            {/* Live Backend Connection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-border shadow-inner-glow text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'UP'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : status === 'CHECKING'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
              <span
                className={`font-medium ${
                  status === 'UP'
                    ? 'text-emerald-400'
                    : status === 'CHECKING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {status === 'UP' ? 'Backend Live' : status === 'CHECKING' ? 'Connecting' : 'Disconnected'}
              </span>
              {data?.version && (
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline pl-1 border-l border-surface-border">
                  v{data.version}
                </span>
              )}
            </div>

            {/* Quick documentation / GitHub link */}
            <a
              href="https://github.com/heemanshu-021/Huffman-Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-surface-border transition-colors"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Primary Page Canvas */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto animate-fade-in space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
