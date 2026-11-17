import React, { useState, useRef, useMemo, ChangeEvent } from 'react';
import { analysisService } from '../services/analysisService';
import { AnalysisResult, TreeNode } from '../types/compression';
import {
  Network,
  Upload,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  isLeaf: boolean;
  depth: number;
  left?: LayoutNode;
  right?: LayoutNode;
}

export const VisualizerPage: React.FC = () => {
  const [inputText, setInputText] = useState('Huffman Studio creates genuine binary archives!');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [zoom, setZoom] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleTexts = [
    { label: 'Pangram', text: 'The quick brown fox jumps over the lazy dog.' },
    { label: 'Repeated', text: 'AAAAAAABBBBBBCCCCDDE' },
    { label: 'Hindi Unicode', text: 'नमस्ते दुनिया! यह हफ़मैन कोडिंग का परीक्षण है।' },
    { label: 'Emojis & Symbols', text: '🚀 Huffman 🌟 Compression ⚡ Matrix 💻 2026' },
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      let res: AnalysisResult;
      if (selectedFile) {
        res = await analysisService.analyzeFile(selectedFile);
      } else {
        if (!inputText.trim()) {
          setError('Please provide text or upload a file to analyze.');
          setIsAnalyzing(false);
          return;
        }
        res = await analysisService.analyzeText(inputText);
      }
      setResult(res);
      setHighlightedCode(null);
      setZoom(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.size < 100000) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) setInputText(ev.target.result as string);
        };
        reader.readAsText(file);
      } else {
        setInputText(`[Loaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute Layout for SVG Tree
  const treeLayout = useMemo(() => {
    if (!result || !result.tree) return null;
    let leafCounter = 0;
    const leafSpacing = 85;
    const depthSpacing = 75;

    function buildLayout(node: TreeNode, depth: number): LayoutNode {
      if (node.isLeaf || (!node.left && !node.right)) {
        const x = leafCounter * leafSpacing + 60;
        leafCounter++;
        return { node, x, y: depth * depthSpacing + 50, isLeaf: true, depth };
      }
      const left = node.left ? buildLayout(node.left, depth + 1) : undefined;
      const right = node.right ? buildLayout(node.right, depth + 1) : undefined;
      const x = left && right ? (left.x + right.x) / 2 : left ? left.x : right ? right.x : 0;
      return { node, x, y: depth * depthSpacing + 50, isLeaf: false, depth, left, right };
    }

    const layout = buildLayout(result.tree, 0);
    const totalWidth = Math.max(800, leafCounter * leafSpacing + 120);
    const maxDepth = (function getMaxDepth(n: LayoutNode): number {
      const l = n.left ? getMaxDepth(n.left) : n.depth;
      const r = n.right ? getMaxDepth(n.right) : n.depth;
      return Math.max(n.depth, l, r);
    })(layout);
    const totalHeight = (maxDepth + 1) * depthSpacing + 90;
    return { layout, totalWidth, totalHeight };
  }, [result]);

  // Flatten nodes/edges for SVG
  const { nodesList, edgesList } = useMemo(() => {
    if (!treeLayout) return { nodesList: [], edgesList: [] };
    const nodes: LayoutNode[] = [];
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; bit: '0' | '1'; childCode: string }> = [];

    function traverse(current: LayoutNode, currentPath: string) {
      nodes.push(current);
      if (current.left) {
        const nextCode = currentPath + '0';
        edges.push({ x1: current.x, y1: current.y, x2: current.left.x, y2: current.left.y, bit: '0', childCode: nextCode });
        traverse(current.left, nextCode);
      }
      if (current.right) {
        const nextCode = currentPath + '1';
        edges.push({ x1: current.x, y1: current.y, x2: current.right.x, y2: current.right.y, bit: '1', childCode: nextCode });
        traverse(current.right, nextCode);
      }
    }

    traverse(treeLayout.layout, '');
    return { nodesList: nodes, edgesList: edges };
  }, [treeLayout]);

  // Filtered code table
  const filteredCodeTable = useMemo(() => {
    if (!result) return [];
    if (!filterQuery.trim()) return result.codeTable;
    const q = filterQuery.toLowerCase();
    return result.codeTable.filter(
      (entry) =>
        entry.displayCharacter.toLowerCase().includes(q) ||
        entry.code.includes(q) ||
        entry.codePoint.toString().includes(q)
    );
  }, [result, filterQuery]);

  // Chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.frequencies.slice(0, 20).map((f) => ({
      name: f.displayCharacter,
      frequency: f.frequency,
      percentage: f.percentage.toFixed(1),
    }));
  }, [result]);

  const rawBits = result ? result.originalByteSize * 8 : 0;
  const avgBitLength =
    result && result.characterCount > 0
      ? (result.encodedBitCount / result.characterCount).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">Huffman Tree Visualizer</h2>
        </div>
        <p className="text-sm text-slate-400">
          Explore authentic Huffman trees generated by the Java 21 backend. Inspect prefix codes and
          trace bit paths interactively.
        </p>
      </div>

      {/* Input section */}
      <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Input Data
          </span>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Presets:
          </span>
          {sampleTexts.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => { clearFile(); setInputText(sample.text); }}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Text area */}
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => { if (selectedFile) clearFile(); setInputText(e.target.value); }}
          placeholder="Enter text or paste Unicode content here..."
          className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/60 resize-y"
        />

        {/* Action row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.csv,.json,.md,.log"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5 text-emerald-400" />}
            >
              {selectedFile ? selectedFile.name : 'Upload File'}
            </Button>
            {selectedFile && (
              <button
                type="button"
                onClick={clearFile}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear file
              </button>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            loading={isAnalyzing}
            leftIcon={<Play className="w-4 h-4" />}
          >
            {isAnalyzing ? 'Building Tree in Java…' : 'Generate Huffman Tree'}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Characters" value={result.characterCount.toLocaleString()} accent="slate" />
            <MetricCard label="Unique Symbols" value={result.uniqueCharacterCount.toLocaleString()} accent="emerald" />
            <MetricCard label="Raw Bits (8b)" value={rawBits.toLocaleString()} accent="slate" />
            <MetricCard label="Encoded Bits" value={result.encodedBitCount.toLocaleString()} accent="emerald" />
            <MetricCard label="Avg Bit/Char" value={`${avgBitLength}b`} accent="indigo" />
            <MetricCard label="Theory Savings" value={`${result.percentageSaved.toFixed(1)}%`} accent="emerald" />
          </div>

          {/* SVG Tree */}
          <div className="rounded-xl border border-slate-800/80 bg-[#14141c] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60">
              <div>
                <p className="text-sm font-semibold text-slate-100">Interactive Huffman Binary Tree</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Left branches = 0 · Right branches = 1 · Hover code table rows to trace path
                </p>
              </div>
              <div className="flex items-center gap-2">
                {highlightedCode && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setHighlightedCode(null)}
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    Reset Trace
                  </Button>
                )}
                <div className="flex items-center gap-1 border border-slate-700/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-slate-500 px-1 min-w-[36px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label="Fit to screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {treeLayout ? (
              <div className="w-full overflow-x-auto bg-slate-950/80 p-4 min-h-[420px]">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                    display: 'inline-block',
                    minWidth: treeLayout.totalWidth,
                  }}
                >
                  <svg
                    width={treeLayout.totalWidth}
                    height={treeLayout.totalHeight}
                    className="mx-auto block"
                  >
                    {/* Edges */}
                    {edgesList.map((edge, idx) => {
                      const isEdgeActive = highlightedCode !== null && highlightedCode.startsWith(edge.childCode);
                      const isEdgeDimmed = highlightedCode !== null && !isEdgeActive;
                      return (
                        <g key={`edge-${idx}`}>
                          <line
                            x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                            stroke={isEdgeActive ? '#10b981' : isEdgeDimmed ? '#1e293b' : '#334155'}
                            strokeWidth={isEdgeActive ? 3 : 1.5}
                            strokeLinecap="round"
                            className="transition-colors duration-200"
                          />
                          <circle
                            cx={(edge.x1 + edge.x2) / 2}
                            cy={(edge.y1 + edge.y2) / 2}
                            r={10}
                            fill={isEdgeActive ? '#064e3b' : edge.bit === '0' ? '#0f172a' : '#1e1b4b'}
                            stroke={isEdgeActive ? '#10b981' : edge.bit === '0' ? '#0284c7' : '#a855f7'}
                            strokeWidth={1.2}
                          />
                          <text
                            x={(edge.x1 + edge.x2) / 2}
                            y={(edge.y1 + edge.y2) / 2 + 4}
                            textAnchor="middle"
                            fill={isEdgeActive ? '#6ee7b7' : '#94a3b8'}
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {edge.bit}
                          </text>
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {nodesList.map((item, idx) => {
                      const isLeaf = item.isLeaf;
                      const code = item.node.code || '';
                      const isTargetLeaf = highlightedCode !== null && isLeaf && highlightedCode === code;
                      const isAncestorNode = highlightedCode !== null && !isLeaf && highlightedCode.startsWith(code);
                      const isDimmed = highlightedCode !== null && !isTargetLeaf && !isAncestorNode;

                      if (isLeaf) {
                        return (
                          <g
                            key={`node-${idx}`}
                            className="cursor-pointer"
                            onClick={() => setHighlightedCode(code)}
                          >
                            <rect
                              x={item.x - 30} y={item.y - 18} width={60} height={44} rx={8}
                              fill={isTargetLeaf ? '#047857' : isDimmed ? '#091512' : '#064e3b'}
                              stroke={isTargetLeaf ? '#34d399' : isDimmed ? '#064e3b' : '#10b981'}
                              strokeWidth={isTargetLeaf ? 2.5 : 1.5}
                            />
                            <text
                              x={item.x} y={item.y - 1}
                              textAnchor="middle" fill="#f8fafc"
                              fontSize={13} fontWeight="bold" fontFamily="monospace"
                            >
                              {item.node.displayCharacter}
                            </text>
                            <text
                              x={item.x} y={item.y + 15}
                              textAnchor="middle" fill="#a7f3d0"
                              fontSize={10} fontFamily="monospace"
                            >
                              {item.node.frequency}
                            </text>
                          </g>
                        );
                      }

                      return (
                        <g key={`node-${idx}`}>
                          <circle
                            cx={item.x} cy={item.y} r={18}
                            fill={isAncestorNode ? '#047857' : isDimmed ? '#090d16' : '#0f172a'}
                            stroke={isAncestorNode ? '#34d399' : isDimmed ? '#1e293b' : '#475569'}
                            strokeWidth={isAncestorNode ? 2.5 : 1.5}
                          />
                          <text
                            x={item.x} y={item.y + 4}
                            textAnchor="middle"
                            fill={isAncestorNode ? '#f8fafc' : '#cbd5e1'}
                            fontSize={11} fontFamily="monospace" fontWeight="600"
                          >
                            {item.node.frequency}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : null}
          </div>

          {/* Code Table + Frequency Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Table */}
            <div className="rounded-xl border border-slate-800/80 bg-[#14141c] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Prefix-Free Code Table</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Variable-length bit sequences — hover to trace tree path
                  </p>
                </div>
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search symbol…"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                  />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-500 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="text-[10px] uppercase tracking-wider py-2.5 px-3 font-semibold">Symbol</th>
                      <th className="text-[10px] uppercase tracking-wider py-2.5 px-3 font-semibold">Unicode</th>
                      <th className="text-[10px] uppercase tracking-wider py-2.5 px-3 font-semibold">Freq</th>
                      <th className="text-[10px] uppercase tracking-wider py-2.5 px-3 font-semibold">Code</th>
                      <th className="text-[10px] uppercase tracking-wider py-2.5 px-3 font-semibold">Bits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {filteredCodeTable.map((entry) => {
                      const isRowActive = highlightedCode === entry.code;
                      return (
                        <tr
                          key={entry.codePoint}
                          onMouseEnter={() => setHighlightedCode(entry.code)}
                          onMouseLeave={() => !isRowActive && setHighlightedCode(null)}
                          onClick={() => setHighlightedCode(entry.code)}
                          className={`cursor-pointer transition-colors ${
                            isRowActive
                              ? 'bg-emerald-950/50 border-l-2 border-emerald-400'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-white">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                              {entry.displayCharacter}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            U+{entry.codePoint.toString(16).toUpperCase().padStart(4, '0')}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{entry.frequency.toLocaleString()}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold tracking-widest">{entry.code}</td>
                          <td className="py-2 px-3 text-slate-500">{entry.bitLength}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Frequency Chart */}
            <div className="rounded-xl border border-slate-800/80 bg-[#14141c] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800/60">
                <p className="text-sm font-semibold text-slate-100">Symbol Frequency Distribution</p>
                <p className="text-xs text-slate-500 mt-0.5">Top 20 most frequent characters</p>
              </div>
              <div className="p-4 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={11}
                      interval={0}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis stroke="#475569" fontSize={11} tick={{ fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(value: number, _name: string, props: { payload?: { percentage?: string } }) => [
                        `${value} (${props.payload?.percentage ?? ''}%)`,
                        'Frequency',
                      ]}
                    />
                    <Bar dataKey="frequency" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Highlighted code info */}
          {highlightedCode && (() => {
            const entry = result.codeTable.find((e) => e.code === highlightedCode);
            if (!entry) return null;
            return (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center justify-between flex-wrap gap-4 animate-fade-in">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-2xl font-bold text-white">
                    {entry.displayCharacter}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="emerald">U+{entry.codePoint.toString(16).toUpperCase().padStart(4, '0')}</Badge>
                      <Badge variant="slate">freq: {entry.frequency}</Badge>
                      <Badge variant="indigo">{entry.bitLength} bits</Badge>
                    </div>
                    <p className="font-mono text-emerald-300 text-sm font-bold tracking-widest mt-1">
                      {entry.code}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHighlightedCode(null)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Clear selection
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
