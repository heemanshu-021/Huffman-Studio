import React from 'react';
import { Card } from '../components/Card';
import { HelpCircle, BarChart3, Binary, GitFork, FileArchive, CheckCircle2 } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Frequency Analysis',
      icon: BarChart3,
      description:
        'The input text is scanned byte-by-byte to calculate symbol occurrences across the 256-value byte spectrum (0x00 to 0xFF).',
    },
    {
      step: '02',
      title: 'Greedy Priority Queue Tree Construction',
      icon: GitFork,
      description:
        'Every symbol forms a single-node tree with its frequency as weight. A min-heap iteratively extracts the two lowest-weight nodes, merges them under a parent, and reinserts until one root remains.',
    },
    {
      step: '03',
      title: 'Prefix-Free Code Generation',
      icon: Binary,
      description:
        'Traversing from root to leaf generates unique variable-length bit codes (left = 0, right = 1). More frequent characters receive shorter codes, guaranteeing optimal entropy.',
    },
    {
      step: '04',
      title: 'Bit-Packing into .huf Archive',
      icon: FileArchive,
      description:
        'The backend bit-writer streams variable-length codes into 8-bit bytes, prepending the 4-byte HUFF magic header, padding count, and serialized tree metadata.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-emerald-400" />
          How Huffman Coding Works
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Theoretical foundation and algorithmic pipeline implemented in Huffman Studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.step}>
              <div className="flex items-start gap-4">
                <span className="font-mono text-2xl font-black text-emerald-500/40">{item.step}</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Academic Highlights */}
      <Card title="Key Theoretical Guarantees" subtitle="Why Huffman coding is optimal">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Prefix-Free Property
            </div>
            <p className="text-xs text-slate-400">
              No code is a prefix of another, enabling instantaneous unambiguous decoding without delimiters.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Optimal Greedy Choice
            </div>
            <p className="text-xs text-slate-400">
              Proven by David Huffman (1952) to yield the minimum expected code length for independent character models.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Lossless Recovery
            </div>
            <p className="text-xs text-slate-400">
              Exact byte-for-byte fidelity guaranteed upon decompression with zero perceptual loss.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
