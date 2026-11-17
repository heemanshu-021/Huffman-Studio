import React from 'react';
import { Card } from '../components/Card';
import { Network, GitGraph, Sparkles, ShieldAlert } from 'lucide-react';

export const VisualizerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Network className="w-6 h-6 text-emerald-400" />
          Huffman Tree Visualizer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Interactive binary tree diagram showcasing greedy construction, node frequencies, and prefix-free code paths.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <GitGraph className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-semibold text-slate-200">Interactive SVG Tree Viewport</h3>
                <p className="text-xs text-slate-400">
                  Interactive node exploration, path highlighting (0 = left branch, 1 = right branch), and prefix code lookup tables.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Module Status" subtitle="Engineering Roadmap">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Scheduled for Phase 6
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The visualizer transforms JSON node hierarchies emitted by the Java 21 backend into interactive SVG graphs with zoom, pan, and real-time path highlights.
              </p>
              <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Visual viva presentation ready
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
