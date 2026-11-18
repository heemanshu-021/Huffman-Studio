import React, { useState } from 'react';
import {
  BookOpen,
  BarChart3,
  Binary,
  GitFork,
  FileArchive,
  HardDrive,
  ShieldCheck,
  Info,
  Network,
  ArrowRight,
  ChevronDown,
  Layers,
  Cpu,
  Copy,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';

interface Step {
  num: string;
  title: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  detail: string;
  sourceFile: string;
  code?: string;
}

const ALGORITHM_STEPS: Step[] = [
  {
    num: '01',
    title: 'Character Frequency Calculation',
    icon: BarChart3,
    badge: 'O(N) Scan',
    summary: 'Scan input → build Unicode frequency map',
    detail:
      'The input text is decoded as UTF-8 and every Unicode code point is counted. The resulting frequency table maps each distinct character (including spaces, punctuation, Hindi or multi-byte glyphs, and emojis) to its exact count. Empty text is handled cleanly without exceptions.',
    sourceFile: 'FrequencyCounter.java',
    code: `public Map<Integer, Long> countFrequencies(String text) {
    return text.codePoints()
        .boxed()
        .collect(Collectors.groupingBy(
            Function.identity(),
            Collectors.counting()
        ));
}`,
  },
  {
    num: '02',
    title: 'Min-Heap Priority Queue Construction',
    icon: GitFork,
    badge: 'Greedy Ordering',
    summary: 'Initialize min-heap sorted by frequency ascending',
    detail:
      'Each distinct symbol becomes a leaf node with its frequency as its weight. All leaf nodes are inserted into a Java PriorityQueue ordered ascendingly by frequency (with deterministic tie-breaking by code point). This guarantees the two lowest-frequency symbols are always accessible in O(log K) time.',
    sourceFile: 'HuffmanTreeBuilder.java',
    code: `PriorityQueue<HuffmanNode> pq = new PriorityQueue<>(
    Comparator.comparingLong(HuffmanNode::getFrequency)
        .thenComparingInt(HuffmanNode::getCodePoint)
);
for (var entry : frequencyMap.entrySet()) {
    pq.offer(new HuffmanNode(entry.getKey(), entry.getValue()));
}`,
  },
  {
    num: '03',
    title: 'Huffman Binary Tree Assembly',
    icon: Network,
    badge: 'Pairwise Merge',
    summary: 'Iteratively merge lowest pairs until one root remains',
    detail:
      'While the priority queue holds more than one node: extract the two minimum-weight nodes, create an internal parent node whose frequency is the exact sum of both children, attach the lower frequency to left (0) and higher to right (1), and re-insert into the queue. After K - 1 merges, a single root node remains.',
    sourceFile: 'HuffmanTreeBuilder.java',
    code: `while (pq.size() > 1) {
    HuffmanNode left = pq.poll();
    HuffmanNode right = pq.poll();
    long combinedFreq = left.getFrequency() + right.getFrequency();
    pq.offer(new HuffmanNode(left, right, combinedFreq));
}
return pq.peek();`,
  },
  {
    num: '04',
    title: 'Prefix-Free Code Generation',
    icon: Binary,
    badge: 'DFS Traversal',
    summary: 'Traverse tree branches to generate bit sequences',
    detail:
      'Starting from the root, a depth-first traversal appends "0" on every left branch and "1" on every right branch. When a leaf is reached, the accumulated bit string forms that symbol\'s unique Huffman code. High-frequency symbols end up closer to the root with shorter codes, minimizing expected bit length.',
    sourceFile: 'HuffmanCodeGenerator.java',
    code: `private void generateCodes(HuffmanNode node, String path, Map<Integer, String> table) {
    if (node.isLeaf()) {
        table.put(node.getCodePoint(), path.isEmpty() ? "0" : path);
        return;
    }
    generateCodes(node.getLeft(), path + "0", table);
    generateCodes(node.getRight(), path + "1", table);
}`,
  },
  {
    num: '05',
    title: 'Bitstream Encoding & Byte Packing',
    icon: Binary,
    badge: 'Binary Packing',
    summary: 'Stream variable bits into packed 8-bit bytes',
    detail:
      'The original text is re-scanned and each code point is substituted with its binary code. A custom BitWriter shifts bits into an internal byte buffer and flushes 8-bit bytes into the output stream as soon as full. Between 0 and 7 padding bits are added to close the final byte, with the padding count stored in the header.',
    sourceFile: 'BitWriter.java',
    code: `public void writeBits(String bitString) throws IOException {
    for (int i = 0; i < bitString.length(); i++) {
        buffer = (buffer << 1) | (bitString.charAt(i) == '1' ? 1 : 0);
        bitCount++;
        if (bitCount == 8) {
            out.write(buffer);
            buffer = 0; bitCount = 0;
        }
    }
}`,
  },
  {
    num: '06',
    title: '.huf Self-Contained Archive Construction',
    icon: FileArchive,
    badge: 'Archive Layout',
    summary: 'Assemble 29-byte fixed header + tree + payload',
    detail:
      'The archive is an authentic standalone binary file. It writes a 29-byte fixed header containing magic bytes HUFN (0x4855464E), version (1), unique symbol count, total bit count, serialized tree byte length, padding bits, and an IEEE 802.3 CRC-32 checksum. Following the header, the tree is serialized in preorder traversal, followed by the packed bitstream payload.',
    sourceFile: 'HuffmanArchiveWriter.java',
    code: `// Fixed 29-Byte Header Layout
dos.writeInt(0x4855464E);      // Magic "HUFN"
dos.writeByte(1);               // Version 1
dos.writeInt(uniqueSymbols);    // Distinct code points
dos.writeLong(totalBits);       // Encoded payload bit count
dos.writeInt(treeByteLength);   // Preorder tree bytes
dos.writeByte(paddingBits);     // 0..7 padding
dos.writeInt(0);                // Reserved alignment
dos.writeInt((int) crc32);      // Checksum over raw payload`,
  },
  {
    num: '07',
    title: 'Autonomous Decompression & Verification',
    icon: ShieldCheck,
    badge: 'CRC-32 Integrity',
    summary: 'Rebuild tree from header bits → decode and verify',
    detail:
      'The decompressor requires no prior knowledge or out-of-band tree. It reads the 29-byte header, verifies the HUFN magic and format version, reconstructs the Huffman tree from preorder bits, and walks the tree bit-by-bit using BitReader (branching left on 0, right on 1). Each leaf outputs a character. The CRC-32 of all recovered bytes is compared against the header checksum for 100% integrity validation.',
    sourceFile: 'HuffmanArchiveReader.java',
    code: `// Walk tree bit by bit until leaf
HuffmanNode curr = root;
for (long b = 0; b < totalBits; b++) {
    int bit = bitReader.readBit();
    curr = (bit == 0) ? curr.getLeft() : curr.getRight();
    if (curr.isLeaf()) {
        decodedStream.write(curr.getCodePoint());
        curr = root;
    }
}
verifyCrc32(decodedStream.toByteArray(), storedCrc32);`,
  },
];

interface BinarySegment {
  id: string;
  name: string;
  bytes: string;
  color: string;
  borderColor: string;
  value: string;
  description: string;
}

const BINARY_SEGMENTS: BinarySegment[] = [
  {
    id: 'magic',
    name: 'Magic Signature',
    bytes: '4 Bytes',
    color: 'bg-emerald-500/10 text-emerald-300',
    borderColor: 'border-emerald-500/30',
    value: '0x48 0x55 0x46 0x4E ("HUFN")',
    description: 'Unique file signature identifying this as an authentic Huffman Studio archive. Prevents accidental decompression of foreign binaries.',
  },
  {
    id: 'version',
    name: 'Version',
    bytes: '1 Byte',
    color: 'bg-cyan-500/10 text-cyan-300',
    borderColor: 'border-cyan-500/30',
    value: '0x01',
    description: 'Archive specification version for backward/forward compatibility handling.',
  },
  {
    id: 'codepoints',
    name: 'Code Points',
    bytes: '4 Bytes',
    color: 'bg-indigo-500/10 text-indigo-300',
    borderColor: 'border-indigo-500/30',
    value: 'uint32 Big-Endian',
    description: 'Total number of distinct Unicode symbols stored in the serialized tree.',
  },
  {
    id: 'bitcount',
    name: 'Total Bit Count',
    bytes: '8 Bytes',
    color: 'bg-purple-500/10 text-purple-300',
    borderColor: 'border-purple-500/30',
    value: 'uint64 Big-Endian',
    description: 'Exact number of active payload bits. Tells decompressor exactly when to stop, ignoring terminal padding bits.',
  },
  {
    id: 'treebytes',
    name: 'Tree Size',
    bytes: '4 Bytes',
    color: 'bg-amber-500/10 text-amber-300',
    borderColor: 'border-amber-500/30',
    value: 'uint32 Big-Endian',
    description: 'Byte length of the serialized preorder Huffman tree segment.',
  },
  {
    id: 'padding',
    name: 'Padding Bits',
    bytes: '1 Byte',
    color: 'bg-slate-700/30 text-slate-300',
    borderColor: 'border-slate-600/40',
    value: '0..7 bits',
    description: 'Number of extra unused bits added to align the payload to an 8-bit byte boundary.',
  },
  {
    id: 'reserved',
    name: 'Reserved',
    bytes: '4 Bytes',
    color: 'bg-slate-800/40 text-slate-400',
    borderColor: 'border-slate-700/40',
    value: '0x00000000',
    description: 'Reserved alignment bytes for 32-bit boundary optimization and future compression flags.',
  },
  {
    id: 'crc32',
    name: 'CRC-32 Checksum',
    bytes: '4 Bytes',
    color: 'bg-rose-500/10 text-rose-300',
    borderColor: 'border-rose-500/30',
    value: 'IEEE 802.3 uint32',
    description: 'Cyclic redundancy check computed over the original uncompressed byte content. Validates complete losslessness.',
  },
  {
    id: 'tree',
    name: 'Serialized Tree',
    bytes: 'Variable',
    color: 'bg-teal-500/10 text-teal-300',
    borderColor: 'border-teal-500/30',
    value: 'Preorder bitstream',
    description: 'Compact recursive preorder traversal: 0 for internal node, 1 + UTF-8 bytes for leaf node.',
  },
  {
    id: 'payload',
    name: 'Bitstream Payload',
    bytes: 'Variable',
    color: 'bg-emerald-600/20 text-emerald-200',
    borderColor: 'border-emerald-500/40',
    value: 'Packed bit bytes',
    description: 'Actual binary Huffman encoded bit sequence packed tightly into 8-bit bytes.',
  },
];

const FAQS = [
  {
    q: 'Why do small text files sometimes produce a larger .huf archive?',
    a: 'Every .huf file contains a 29-byte fixed header plus the serialized Huffman tree structure required for independent decompression. For tiny inputs (e.g. 10 to 50 bytes), this container overhead naturally exceeds the 30–50% bit savings. For real-world texts, payloads grow while the header remains a constant 29 bytes, achieving significant net compression.',
  },
  {
    q: 'What is the prefix-free property and why is it essential?',
    a: 'A code is prefix-free if no valid code is a prefix of any other code (e.g., if "A" is "0", no other code can start with "0"). This guarantees that a decoder reading bits from left to right can unambiguously identify a symbol the exact microsecond a tree leaf is reached, without needing delimiters, lookahead, or backtracking.',
  },
  {
    q: 'How does preorder tree serialization work?',
    a: 'The Huffman tree is serialized using a recursive bitstream: a single "0" bit represents an internal routing node, while a "1" bit represents a leaf node followed immediately by its UTF-8 Unicode code point bytes. The decompressor mirrors this DFS recursion to rebuild the exact tree in O(K) time.',
  },
  {
    q: 'How does CRC-32 guarantee lossless integrity?',
    a: 'Before compression, the original bytes are fed through standard IEEE 802.3 CRC-32 polynomial division to generate a 32-bit checksum. Upon decompression, the recovered bytes are fed through the same polynomial. If even a single bit in the archive is flipped or corrupted, the decompressor halts with a diagnostic CRC mismatch error.',
  },
  {
    q: 'Can .huf files be transferred and opened on any computer?',
    a: 'Yes! Huffman Studio .huf archives are 100% self-contained. The archive includes the format signature, the serialized tree, and the payload. No in-memory state or shared configuration is needed—any standard Huffman Studio instance can decompress it independently.',
  },
];

export const HowItWorksPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedSegment, setSelectedSegment] = useState<BinarySegment>(BINARY_SEGMENTS[0]);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 1800);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <SectionHeader
        title="How Huffman Coding Works"
        description="A complete architectural walkthrough of the lossless compression engine implemented in Huffman Studio—from raw Unicode text to self-contained .huf binary archives and back."
        icon={<BookOpen className="w-5 h-5" />}
        badge={
          <Badge variant="cyan" dot>
            Architecture Reference
          </Badge>
        }
        actions={
          <Link
            to="/visualizer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
          >
            <Network className="w-3.5 h-3.5" />
            Launch Visualizer
          </Link>
        }
      />

      {/* Interactive 7-Step Walkthrough */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              7-Step Algorithmic Pipeline
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Step {activeStep + 1} of {ALGORITHM_STEPS.length}
          </span>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ALGORITHM_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isActive
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-glow-emerald'
                    : 'bg-surface-card border-surface-border hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isActive ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {step.num}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] font-semibold text-slate-200 line-clamp-1">
                  {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
                </p>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {step.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card */}
        {(() => {
          const step = ALGORITHM_STEPS[activeStep];
          const Icon = step.icon;
          return (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 bg-surface-1/90 shadow-glow-card space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        STEP {step.num}
                      </span>
                      <Badge variant="emerald">{step.badge}</Badge>
                      <span className="text-xs text-slate-500 font-mono">
                        {step.sourceFile}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mt-0.5">
                      {step.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 hover:bg-surface-3 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-surface-border transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={activeStep === ALGORITHM_STEPS.length - 1}
                    onClick={() =>
                      setActiveStep((prev) => Math.min(ALGORITHM_STEPS.length - 1, prev + 1))
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </div>

              {/* Description text */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {step.detail}
              </p>

              {/* Real Java Code Snippet */}
              {step.code && (
                <div className="rounded-xl bg-surface-0 border border-surface-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-2/40 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {step.sourceFile}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(step.code!, step.num)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedSnippet === step.num ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
                    {step.code}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Interactive .huf Binary Layout Visualizer */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                .huf Binary Archive Layout
              </h3>
              <p className="text-xs text-slate-400">
                Fixed 29-byte header specification followed by dynamic preorder tree and bitstream
              </p>
            </div>
          </div>
          <Badge variant="indigo" dot>
            29-Byte Header Layout
          </Badge>
        </div>

        {/* Interactive Segment Bar */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2 block">
            Click any segment to inspect its binary format:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {BINARY_SEGMENTS.map((seg) => {
              const isSelected = selectedSegment.id === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSelectedSegment(seg)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    seg.color
                  } ${seg.borderColor} ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 shadow-glow-emerald scale-105 z-10'
                      : 'hover:opacity-90'
                  }`}
                >
                  <p className="font-bold text-[11px] truncate">{seg.name}</p>
                  <p className="text-[10px] opacity-75 mt-0.5">{seg.bytes}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Segment Details Inspector */}
        <div className="p-4 rounded-xl bg-surface-0 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">
                {selectedSegment.name}
              </span>
              <Badge variant="slate">{selectedSegment.bytes}</Badge>
              <code className="text-[11px] font-mono text-emerald-400 bg-surface-2 px-2 py-0.5 rounded">
                {selectedSegment.value}
              </code>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {selectedSegment.description}
            </p>
          </div>
        </div>
      </div>

      {/* Prefix-Free Property & Mathematical Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Prefix-Free Property',
            tag: 'Zero Delimiters',
            desc: 'No Huffman code forms the prefix of another. This allows an independent bitstream parser to stream bits and emit symbols the instant a leaf is hit.',
          },
          {
            title: 'Optimal Greedy Strategy',
            tag: 'David Huffman (1952)',
            desc: 'Proven to yield the absolute minimum expected code length among all symbol-by-symbol lossless encoding schemes for independent sources.',
          },
          {
            title: 'Lossless Byte Fidelity',
            tag: 'IEEE 802.3 CRC-32',
            desc: 'Exact byte-for-byte roundtrip guaranteed. Embedded 32-bit checksum verifies that decoded content is identical to the original input.',
          },
        ].map(({ title, tag, desc }) => (
          <div
            key={title}
            className="glass-card rounded-2xl p-5 border border-surface-border space-y-2 hover:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">{title}</span>
              <Badge variant="slate" className="text-[10px]">
                {tag}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Technical FAQ Accordion */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            Frequently Asked Technical Questions
          </h3>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl border border-surface-border overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-2/40 transition-colors"
              >
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${
                    openFaq === i ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-surface-border bg-surface-0/50 animate-slide-down">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visualizer CTA Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-surface-1 to-cyan-950/30 p-8 shadow-glow-emerald">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100">
              Ready to observe Huffman tree construction live?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Open the interactive Visualizer to trace root-to-leaf paths, pan across custom datasets, and inspect bit allocations in real time.
            </p>
          </div>
          <Link
            to="/visualizer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Network className="w-4 h-4" />
            Launch Visualizer
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
