import React from 'react';
import { Card } from '../components/Card';
import { FileArchive, UploadCloud, ShieldAlert, Cpu } from 'lucide-react';

export const CompressorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <FileArchive className="w-6 h-6 text-emerald-400" />
          Text File Compressor
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload plain text files to generate genuine bit-packed <code className="text-emerald-400 font-mono">.huf</code> archives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-10 text-center transition-colors bg-slate-900/40">
              <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200">Drag &amp; drop text file here</h3>
              <p className="text-xs text-slate-400 mt-1">
                Supports .txt, .csv, .json, and source files up to 50MB
              </p>
              <div className="mt-6">
                <button
                  disabled
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                >
                  Browse Files (Phase 5)
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
                The compression pipeline will be powered by the Java 21 backend&#39;s pure algorithm classes (<code className="text-emerald-400 font-mono">FrequencyCounter</code>, <code className="text-emerald-400 font-mono">HuffmanTree</code>, <code className="text-emerald-400 font-mono">BitWriter</code>) connected via <code className="text-emerald-400 font-mono">POST /api/compress</code>.
              </p>
              <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Pure Java stream processing
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
