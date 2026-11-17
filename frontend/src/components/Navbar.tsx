import React from 'react';
import { NavLink } from 'react-router-dom';
import { Network, FileArchive, FileText, Binary, HelpCircle, Cpu } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { HealthStatus } from '../hooks/useHealthCheck';

interface NavbarProps {
  healthStatus: HealthStatus;
  version?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ healthStatus, version }) => {
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Cpu, end: true },
    { to: '/compress', label: 'Compressor', icon: FileArchive },
    { to: '/decompress', label: 'Decompressor', icon: FileText },
    { to: '/visualizer', label: 'Tree Visualizer', icon: Network },
    { to: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-100 tracking-tight group-hover:text-emerald-400 transition-colors">
                Huffman Studio
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-semibold">
                Text Compression Suite
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Backend Health Badge */}
          <div className="flex items-center gap-3">
            <StatusBadge status={healthStatus} version={version} />
          </div>
        </div>
      </div>
    </header>
  );
};
