import React from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Huffman Studio &bull; University-Level Text Compression Architecture</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-mono">
            <GitBranch className="w-3.5 h-3.5" />
            Phase 1: Foundation &amp; Architecture
          </span>
          <span>&bull;</span>
          <span>Java 21 Spring Boot + React TypeScript</span>
        </div>
      </div>
    </footer>
  );
};
