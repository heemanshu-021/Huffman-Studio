import React from 'react';
import { Card } from '../components/Card';
import { FileText, FileCheck, ShieldAlert, Cpu } from 'lucide-react';

export const DecompressorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-emerald-400" />
          Archive Decompressor
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload previously generated <code className="text-emerald-400 font-mono">.huf</code> archives to reconstruct the original text with byte-for-byte fidelity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-10 text-center transition-colors bg-slate-900/40">
              <FileCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200">Select .huf archive to decompress</h3>
              <p className="text-xs text-slate-400 mt-1">
                Reads the 4-byte HUFF magic header and decodes embedded tree bits
              </p>
              <div className="mt-6">
                <button
                  disabled
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                >
                  Upload .huf File (Phase 5)
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Module Status" subtitle="Engineering Roadmap">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Scheduled for Phase 4 &amp; 5
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Decompression reconstructs the exact tree topology from the archive header and traverses the bitstream using <code className="text-emerald-400 font-mono">BitReader</code>. Verified via <code className="text-emerald-400 font-mono">POST /api/decompress</code>.
              </p>
              <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Stateless archive self-sufficiency
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
