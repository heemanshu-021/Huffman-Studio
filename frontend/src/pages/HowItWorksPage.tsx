import React, { useState } from 'react';
import {
  BookOpen,
  BarChart3,
  Binary,
  GitFork,
  FileArchive,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  Info,
  Network,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Step {
  num: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  detail: string;
  code?: string;
}

const ALGORITHM_STEPS: Step[] = [
  {
    num: '01',
    title: 'Character Frequency Calculation',
    icon: BarChart3,
    summary: 'Scan input → build frequency map',
    detail:
      'The input text is decoded as UTF-8 and each Unicode code point is counted. The result is a frequency table such as {"e":120, "t":98, "a":86, ...}. Spaces, punctuation, and multi-byte characters are all treated as individual symbols. Empty input is handled gracefully.',
    code: 'Map<Integer, Long> freq = text.codePoints()\n  .boxed()\n  .collect(groupingBy(\n    Function.identity(), counting()));',
  },
  {
    num: '02',
    title: 'Priority Queue Construction',
    icon: GitFork,
    summary: 'Build min-heap from leaf nodes',
    detail:
      'Each unique symbol becomes a leaf node with its frequency as weight. All leaf nodes are inserted into a Java PriorityQueue ordered by frequency ascending. This guarantees the two rarest symbols are always at the front — the core of the greedy strategy.',
    code: 'PriorityQueue<HuffmanNode> pq =\n  new PriorityQueue<>(\n    Comparator.comparingLong(\n      HuffmanNode::getFrequency));',
  },
  {
    num: '03',
    title: 'Huffman Tree Generation',
    icon: Network,
    summary: 'Merge pairs until one root remains',
    detail:
      'While the queue has more than one node: extract the two minimum-frequency nodes, create a new internal node whose frequency is their sum, attach the two as left (lower freq) and right (higher freq) children, and re-insert. After n-1 merges (n = unique symbols), a single root node remains.',
    code: 'while (pq.size() > 1) {\n  HuffmanNode l = pq.poll();\n  HuffmanNode r = pq.poll();\n  pq.offer(new HuffmanNode(l, r,\n    l.freq + r.freq));\n}',
  },
  {
    num: '04',
    title: 'Prefix-Free Code Assignment',
    icon: Binary,
    summary: 'Traverse tree → assign bit codes',
    detail:
      'Starting from the root, a recursive DFS assigns "0" for each left branch and "1" for each right branch. When a leaf is reached, the accumulated bit string becomes that symbol\'s Huffman code. No code is a prefix of another (prefix-free property), enabling unambiguous decoding.',
  },
  {
    num: '05',
    title: 'Bitstream Encoding and Bit Packing',
    icon: Binary,
    summary: 'Replace each symbol with its bit code',
    detail:
      'The original text is re-scanned and each code point is replaced by its variable-length bit code. A BitWriter accumulates these bits and flushes them into 8-bit bytes. Padding bits (at most 7) are added to complete the final byte; the count of padding bits is stored in the header.',
    code: 'BitWriter bw = new BitWriter(out);\nfor (int cp : codePoints) {\n  bw.writeBits(table.get(cp));\n}\nbw.flush(); // writes padding',
  },
  {
    num: '06',
    title: '.huf Archive Construction',
    icon: FileArchive,
    summary: 'Write magic + header + tree + payload',
    detail:
      'The archive is a self-contained binary file. The header contains: magic bytes HUFF (0x48554646), format version (1 byte), unique code point count (4 bytes), total bit count (8 bytes), tree serialization byte count (4 bytes), padding count (1 byte), and CRC-32 checksum (4 bytes). Then the serialized Huffman tree (preorder traversal), then the encoded payload bytes.',
  },
  {
    num: '07',
    title: 'Independent Decompression',
    icon: ShieldCheck,
    summary: 'Read archive → rebuild tree → decode bits',
    detail:
      'The decompressor reads the magic + header bytes first to validate the file and read all layout metadata. It then deserializes the Huffman tree from the preorder bit sequence. Using a BitReader, it traverses the tree bit by bit — going left on 0, right on 1 — and emits a character whenever a leaf is reached. The CRC-32 of all decoded bytes is verified against the stored checksum.',
  },
];

const FAQs = [
  {
    q: 'Why do small files get larger?',
    a: "The archive includes a 29-byte fixed header plus a serialized Huffman tree (proportional to unique characters). For tiny inputs, this overhead exceeds the bit savings. With larger inputs, the payload savings grow quadratically while the header stays fixed.",
  },
  {
    q: 'Why prefix-free codes?',
    a: "Prefix-free means no valid code is a prefix of another. This lets a decoder scan bits from left to right and emit a character the moment a leaf node is reached — without needing delimiters or lookahead. If 'a' = 0 and 'b' = 01, decoding '01' would be ambiguous. Huffman trees guarantee this property by construction.",
  },
  {
    q: 'Why CRC-32?',
    a: "CRC-32 (IEEE 802.3) is a 32-bit cyclic redundancy check computed over all decompressed bytes. It detects single-bit errors with 100% probability and multi-bit corruption with probability 1 − 2⁻³². It is embedded in the header so an archive can be validated on any machine without the original source.",
  },
];

export const HowItWorksPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">How Huffman Coding Works</h2>
        </div>
        <p className="text-sm text-slate-400">
          A complete walkthrough of the algorithm implemented in Huffman Studio — from raw text to
          binary archive and back.
        </p>
      </div>

      {/* Algorithm walkthrough — vertical timeline */}
      <div className="space-y-0">
        {ALGORITHM_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === ALGORITHM_STEPS.length - 1;
          return (
            <div key={step.num} className="flex gap-4">
              {/* Timeline spine */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-slate-800/80 my-1" />}
              </div>

              {/* Content */}
              <div className={`pb-7 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-emerald-500/60 font-bold">{step.num}</span>
                  <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-2">{step.detail}</p>
                {step.code && (
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    {step.code}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Archive format visual */}
      <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">.huf Archive Binary Layout</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-0 min-w-max text-[10px] font-mono rounded-lg overflow-hidden border border-slate-700/50">
            {[
              { label: 'Magic', bytes: '4B', color: 'bg-emerald-900/60 text-emerald-300', value: '0x48554646' },
              { label: 'Version', bytes: '1B', color: 'bg-blue-900/60 text-blue-300', value: '0x01' },
              { label: 'CodePoints', bytes: '4B', color: 'bg-purple-900/60 text-purple-300', value: 'uint32' },
              { label: 'BitCount', bytes: '8B', color: 'bg-indigo-900/60 text-indigo-300', value: 'int64' },
              { label: 'TreeBytes', bytes: '4B', color: 'bg-cyan-900/60 text-cyan-300', value: 'uint32' },
              { label: 'Padding', bytes: '1B', color: 'bg-slate-700/60 text-slate-300', value: '0–7' },
              { label: 'CRC-32', bytes: '4B', color: 'bg-rose-900/60 text-rose-300', value: 'IEEE 802.3' },
              { label: 'Tree Data', bytes: 'var', color: 'bg-amber-900/60 text-amber-300', value: 'preorder' },
              { label: 'Payload', bytes: 'var', color: 'bg-slate-800/80 text-slate-300', value: 'packed bits' },
            ].map((seg) => (
              <div key={seg.label} className={`flex flex-col items-center px-3 py-2 ${seg.color} border-r border-black/20 last:border-0`}>
                <span className="font-bold">{seg.label}</span>
                <span className="opacity-70">{seg.bytes}</span>
                <span className="opacity-50 text-[9px] mt-0.5">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Fixed header = 29 bytes. Tree and payload sizes are stored in the header for independent
          decompression on any machine.
        </p>
      </div>

      {/* Key guarantees */}
      <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Key Theoretical Guarantees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Prefix-Free Property',
              desc: 'No code is a prefix of another, enabling instantaneous unambiguous decoding without delimiters.',
            },
            {
              title: 'Optimal Greedy Choice',
              desc: 'Proven by David Huffman (1952) to yield the minimum expected code length for independent symbol models.',
            },
            {
              title: 'Lossless Recovery',
              desc: 'Exact byte-for-byte fidelity guaranteed upon decompression — zero information loss.',
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/60 space-y-1.5"
            >
              <p className="text-xs font-semibold text-emerald-300">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Frequently Asked Questions
        </h3>
        {FAQs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800/80 bg-[#14141c] overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
            >
              <span className="text-sm font-medium text-slate-200">{faq.q}</span>
              <ArrowRight
                className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                  openFaq === i ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-slide-down">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            See the algorithm in action
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Use the Tree Visualizer to interactively explore the Huffman tree for any input text.
          </p>
        </div>
        <Link
          to="/visualizer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          <Network className="w-4 h-4" />
          Open Visualizer
        </Link>
      </div>
    </div>
  );
};
