import React, { useState, useRef, useMemo, ChangeEvent, useCallback } from 'react';
import { analysisService } from '../services/analysisService';
import { AnalysisResult, TreeNode, CodeTableEntry } from '../types/compression';
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
  Copy,
  Check,
  ArrowUpDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  isLeaf: boolean;
  depth: number;
  path: string;
  left?: LayoutNode;
  right?: LayoutNode;
}

type SortField = 'frequency' | 'bitLength' | 'symbol';
type SortDirection = 'asc' | 'desc';

export const VisualizerPage: React.FC = () => {
  const [inputText, setInputText] = useState('Huffman Studio creates genuine binary archives!');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedCode, setCopiedCode] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleTexts = [
    { label: 'Pangram', text: 'The quick brown fox jumps over the lazy dog.' },
    { label: 'Repeated', text: 'AAAAAAABBBBBBCCCCDDE' },
    { label: 'Hindi Unicode', text: 'नमस्ते दुनिया! यह हफ़मैन कोडिंग का परीक्षण है।' },
    { label: 'Emojis & Symbols', text: '🚀 Huffman 🌟 Compression ⚡ Matrix 💻 2026' },
    { label: 'Source Code', text: 'const compress = (stream) => huffman.encode(stream);' },
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
      setPan({ x: 0, y: 0 });
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
    const leafSpacing = 92;
    const depthSpacing = 82;

    function buildLayout(node: TreeNode, depth: number, currentPath: string): LayoutNode {
      if (node.isLeaf || (!node.left && !node.right)) {
        const x = leafCounter * leafSpacing + 70;
        leafCounter++;
        return { node, x, y: depth * depthSpacing + 60, isLeaf: true, depth, path: currentPath };
      }
      const left = node.left ? buildLayout(node.left, depth + 1, currentPath + '0') : undefined;
      const right = node.right ? buildLayout(node.right, depth + 1, currentPath + '1') : undefined;
      const x = left && right ? (left.x + right.x) / 2 : left ? left.x : right ? right.x : 0;
      return { node, x, y: depth * depthSpacing + 60, isLeaf: false, depth, path: currentPath, left, right };
    }

    const layout = buildLayout(result.tree, 0, '');
    const totalWidth = Math.max(860, leafCounter * leafSpacing + 140);
    const maxDepth = (function getMaxDepth(n: LayoutNode): number {
      const l = n.left ? getMaxDepth(n.left) : n.depth;
      const r = n.right ? getMaxDepth(n.right) : n.depth;
      return Math.max(n.depth, l, r);
    })(layout);
    const totalHeight = (maxDepth + 1) * depthSpacing + 100;
    return { layout, totalWidth, totalHeight };
  }, [result]);

  // Flatten nodes and edges for SVG
  const { nodesList, edgesList } = useMemo(() => {
    if (!treeLayout) return { nodesList: [], edgesList: [] };
    const nodes: LayoutNode[] = [];
    const edges: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      bit: '0' | '1';
      childCode: string;
      parentCode: string;
    }> = [];

    function traverse(current: LayoutNode) {
      nodes.push(current);
      if (current.left) {
        edges.push({
          x1: current.x,
          y1: current.y,
          x2: current.left.x,
          y2: current.left.y,
          bit: '0',
          childCode: current.left.path,
          parentCode: current.path,
        });
        traverse(current.left);
      }
      if (current.right) {
        edges.push({
          x1: current.x,
          y1: current.y,
          x2: current.right.x,
          y2: current.right.y,
          bit: '1',
          childCode: current.right.path,
          parentCode: current.path,
        });
        traverse(current.right);
      }
    }

    traverse(treeLayout.layout);
    return { nodesList: nodes, edgesList: edges };
  }, [treeLayout]);

  // Selected entry for inspector
  const selectedEntry = useMemo<CodeTableEntry | null>(() => {
    if (!result || !highlightedCode) return null;
    return result.codeTable.find((e) => e.code === highlightedCode) || null;
  }, [result, highlightedCode]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  // Filtered and sorted code table
  const sortedAndFilteredCodeTable = useMemo(() => {
    if (!result) return [];
    let entries = [...result.codeTable];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.displayCharacter.toLowerCase().includes(q) ||
          entry.code.includes(q) ||
          entry.codePoint.toString(16).toLowerCase().includes(q) ||
          entry.codePoint.toString().includes(q)
      );
    }

    entries.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'frequency') {
        comparison = a.frequency - b.frequency;
      } else if (sortField === 'bitLength') {
        comparison = a.bitLength - b.bitLength;
      } else if (sortField === 'symbol') {
        comparison = a.displayCharacter.localeCompare(b.displayCharacter);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return entries;
  }, [result, filterQuery, sortField, sortDirection]);

  // Chart data (top 20)
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.frequencies.slice(0, 20).map((f) => ({
      name: f.displayCharacter,
      frequency: f.frequency,
      percentage: f.percentage.toFixed(1),
    }));
  }, [result]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleFitScreen = useCallback(() => {
    if (!canvasRef.current || !treeLayout) return;
    const containerWidth = canvasRef.current.clientWidth - 40;
    const containerHeight = 520;
    const scaleX = containerWidth / treeLayout.totalWidth;
    const scaleY = containerHeight / treeLayout.totalHeight;
    const newZoom = Math.min(1.2, Math.max(0.3, Math.min(scaleX, scaleY) * 0.95));
    setZoom(newZoom);
    setPan({
      x: (containerWidth - treeLayout.totalWidth * newZoom) / 2,
      y: 20,
    });
  }, [treeLayout]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const rawBits = result ? result.originalByteSize * 8 : 0;
  const avgBitLength =
    result && result.characterCount > 0
      ? (result.encodedBitCount / result.characterCount).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <SectionHeader
        title="Huffman Tree Visualizer"
        description="Explore authentic Huffman binary trees constructed live by the Java 21 engine. Trace root-to-leaf prefix codes, inspect bit allocations, and analyze symbol entropy."
        icon={<Network className="w-5 h-5" />}
        badge={
          <Badge variant="emerald" dot>
            Algorithmic Engine
          </Badge>
        }
        actions={
          result && (
            <div className="flex items-center gap-2">
              <Badge variant="cyan">
                {result.uniqueCharacterCount} Unique Symbols
              </Badge>
              <Badge variant="indigo">
                {result.encodedBitCount.toLocaleString()} Bits
              </Badge>
            </div>
          )
        }
      />

      {/* Input section card */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Input Dataset
            </span>
            <span className="text-[11px] text-slate-500">
              (Live UTF-8 text or custom file)
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold mr-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Presets:
            </span>
            {sampleTexts.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  clearFile();
                  setInputText(sample.text);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-2 hover:bg-surface-3 text-slate-300 border border-surface-border transition-all hover:border-slate-600 active:scale-95"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => {
              if (selectedFile) clearFile();
              setInputText(e.target.value);
            }}
            placeholder="Type or paste any text, Unicode string, or code snippet to build its binary tree..."
            className="w-full rounded-xl bg-surface-0 border border-surface-border p-4 font-mono text-xs text-slate-200 leading-relaxed placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 focus:border-emerald-500/50 resize-y transition-colors"
          />
          {selectedFile && (
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
              <span>{selectedFile.name}</span>
              <button
                type="button"
                onClick={clearFile}
                className="text-rose-400 hover:text-rose-300 ml-1 font-bold"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
              leftIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
            >
              {selectedFile ? 'Change File' : 'Upload File'}
            </Button>
            {selectedFile && (
              <span className="text-xs text-slate-400 font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            loading={isAnalyzing}
            leftIcon={<Play className="w-4 h-4 text-slate-950 fill-current" />}
            className="shadow-glow-emerald"
          >
            {isAnalyzing ? 'Constructing Tree in Java 21…' : 'Generate Huffman Tree'}
          </Button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-300 animate-slide-down">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Workspace */}
      {result && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Characters"
              value={result.characterCount.toLocaleString()}
              accent="slate"
              sub="Total code points"
            />
            <MetricCard
              label="Unique Symbols"
              value={result.uniqueCharacterCount.toLocaleString()}
              accent="emerald"
              sub="Tree leaf count"
            />
            <MetricCard
              label="Raw Bits (8b)"
              value={rawBits.toLocaleString()}
              accent="slate"
              sub="Uncompressed"
            />
            <MetricCard
              label="Encoded Bits"
              value={result.encodedBitCount.toLocaleString()}
              accent="cyan"
              sub="Payload bits"
            />
            <MetricCard
              label="Avg Bit / Char"
              value={`${avgBitLength}b`}
              accent="indigo"
              sub="Entropy rate"
            />
            <MetricCard
              label="Theory Savings"
              value={`${result.percentageSaved.toFixed(1)}%`}
              accent="emerald"
              trend={result.percentageSaved > 0 ? `+${result.percentageSaved.toFixed(1)}%` : undefined}
              sub="Excl. header overhead"
            />
          </div>

          {/* Interactive Tree Canvas Card */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-glow-card border border-surface-border">
            {/* Canvas Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-surface-border bg-surface-1/90 backdrop-blur-md gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Interactive Huffman Binary Tree
                  </h3>
                  <Badge variant="emerald" className="text-[10px]">
                    Live Canvas
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Left branches = <span className="text-cyan-400 font-mono font-bold">0</span> · Right branches ={' '}
                  <span className="text-indigo-400 font-mono font-bold">1</span> · Drag to pan · Click or hover node to trace
                </p>
              </div>

              {/* Viewport & Path controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {highlightedCode && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setHighlightedCode(null)}
                    leftIcon={<RotateCcw className="w-3 h-3 text-emerald-400" />}
                  >
                    Reset Trace
                  </Button>
                )}

                <div className="flex items-center gap-1 border border-surface-border bg-surface-0 rounded-lg p-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))))}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-surface-2 transition-colors"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 px-1.5 min-w-[42px] text-center select-none font-semibold">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-surface-2 transition-colors"
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-surface-border mx-0.5" />
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-surface-2 transition-colors"
                    title="Reset to 100%"
                  >
                    1:1
                  </button>
                  <button
                    onClick={handleFitScreen}
                    className="p-1.5 rounded text-slate-400 hover:text-emerald-300 hover:bg-surface-2 transition-colors"
                    title="Fit to Screen"
                    aria-label="Fit to Screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative w-full h-[540px] overflow-hidden bg-surface-0 bg-dot-pattern select-none ${
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Radial subtle ambient glow at center */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.06),transparent_60%)]" />

              {treeLayout ? (
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                    width: treeLayout.totalWidth,
                    height: treeLayout.totalHeight,
                  }}
                  className="relative pointer-events-auto"
                >
                  <svg
                    width={treeLayout.totalWidth}
                    height={treeLayout.totalHeight}
                    className="block"
                  >
                    <defs>
                      {/* Active glow filter */}
                      <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Leaf gradient */}
                      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#064e3b" />
                        <stop offset="100%" stopColor="#022c22" />
                      </linearGradient>

                      {/* Active leaf gradient */}
                      <linearGradient id="activeLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>

                      {/* Internal node gradient */}
                      <linearGradient id="internalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                    </defs>

                    {/* Edge connections */}
                    {edgesList.map((edge, idx) => {
                      const isEdgeActive =
                        highlightedCode !== null && highlightedCode.startsWith(edge.childCode);
                      const isEdgeDimmed = highlightedCode !== null && !isEdgeActive;

                      return (
                        <g key={`edge-${idx}`}>
                          <line
                            x1={edge.x1}
                            y1={edge.y1}
                            x2={edge.x2}
                            y2={edge.y2}
                            stroke={
                              isEdgeActive
                                ? '#10b981'
                                : isEdgeDimmed
                                ? '#1e293b'
                                : '#334155'
                            }
                            strokeWidth={isEdgeActive ? 3.5 : 1.5}
                            strokeLinecap="round"
                            filter={isEdgeActive ? 'url(#emerald-glow)' : undefined}
                            className="transition-colors duration-200"
                          />
                          {/* Bit badge on branch */}
                          <circle
                            cx={(edge.x1 + edge.x2) / 2}
                            cy={(edge.y1 + edge.y2) / 2}
                            r={11}
                            fill={
                              isEdgeActive
                                ? '#064e3b'
                                : edge.bit === '0'
                                ? '#083344'
                                : '#1e1b4b'
                            }
                            stroke={
                              isEdgeActive
                                ? '#34d399'
                                : edge.bit === '0'
                                ? '#06b6d4'
                                : '#818cf8'
                            }
                            strokeWidth={isEdgeActive ? 2 : 1.2}
                          />
                          <text
                            x={(edge.x1 + edge.x2) / 2}
                            y={(edge.y1 + edge.y2) / 2 + 4}
                            textAnchor="middle"
                            fill={
                              isEdgeActive
                                ? '#6ee7b7'
                                : edge.bit === '0'
                                ? '#67e8f9'
                                : '#c7d2fe'
                            }
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
                      const code = item.path;
                      const isTargetLeaf =
                        highlightedCode !== null && isLeaf && highlightedCode === code;
                      const isAncestorNode =
                        highlightedCode !== null && !isLeaf && highlightedCode.startsWith(code);
                      const isDimmed =
                        highlightedCode !== null && !isTargetLeaf && !isAncestorNode;

                      if (isLeaf) {
                        return (
                          <g
                            key={`node-${idx}`}
                            className="cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedCode(code);
                            }}
                          >
                            {/* Leaf card container */}
                            <rect
                              x={item.x - 34}
                              y={item.y - 22}
                              width={68}
                              height={50}
                              rx={10}
                              fill={
                                isTargetLeaf
                                  ? 'url(#activeLeafGrad)'
                                  : isDimmed
                                  ? '#061310'
                                  : 'url(#leafGrad)'
                              }
                              stroke={
                                isTargetLeaf
                                  ? '#34d399'
                                  : isDimmed
                                  ? '#064e3b'
                                  : '#10b981'
                              }
                              strokeWidth={isTargetLeaf ? 3 : 1.6}
                              filter={isTargetLeaf ? 'url(#emerald-glow)' : undefined}
                              className="transition-all duration-200"
                            />
                            {/* Symbol glyph */}
                            <text
                              x={item.x}
                              y={item.y - 1}
                              textAnchor="middle"
                              fill="#f8fafc"
                              fontSize={14}
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {item.node.displayCharacter}
                            </text>
                            {/* Frequency count */}
                            <text
                              x={item.x}
                              y={item.y + 17}
                              textAnchor="middle"
                              fill={isTargetLeaf ? '#ecfdf5' : '#a7f3d0'}
                              fontSize={10}
                              fontFamily="monospace"
                              fontWeight="600"
                            >
                              freq: {item.node.frequency}
                            </text>
                          </g>
                        );
                      }

                      // Internal node
                      return (
                        <g
                          key={`node-${idx}`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (code) setHighlightedCode(code);
                          }}
                        >
                          <circle
                            cx={item.x}
                            cy={item.y}
                            r={20}
                            fill={
                              isAncestorNode
                                ? '#064e3b'
                                : isDimmed
                                ? '#090d16'
                                : 'url(#internalGrad)'
                            }
                            stroke={
                              isAncestorNode
                                ? '#34d399'
                                : isDimmed
                                ? '#1e293b'
                                : '#475569'
                            }
                            strokeWidth={isAncestorNode ? 3 : 1.5}
                            filter={isAncestorNode ? 'url(#emerald-glow)' : undefined}
                            className="transition-all duration-200"
                          />
                          <text
                            x={item.x}
                            y={item.y + 4.5}
                            textAnchor="middle"
                            fill={isAncestorNode ? '#f8fafc' : '#94a3b8'}
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {item.node.frequency}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}

              {/* Floating Canvas Navigation Hint */}
              <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] font-mono text-slate-500 bg-surface-0/80 px-2.5 py-1 rounded-md border border-surface-border backdrop-blur-sm">
                Pan: Click + Drag · Zoom: Wheel or Buttons
              </div>
            </div>
          </div>

          {/* Selected Character Inspector (Active Callout) */}
          {selectedEntry && (
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/20 shadow-glow-emerald animate-slide-down">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Large symbol glyph display */}
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl font-mono font-bold text-white shadow-inner">
                    {selectedEntry.displayCharacter}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-100">
                        Symbol Inspector
                      </span>
                      <Badge variant="emerald">
                        U+{selectedEntry.codePoint.toString(16).toUpperCase().padStart(4, '0')}
                      </Badge>
                      <Badge variant="cyan">
                        Freq: {selectedEntry.frequency.toLocaleString()}
                      </Badge>
                      <Badge variant="indigo">
                        {selectedEntry.bitLength} bits
                      </Badge>
                    </div>

                    {/* Path breadcrumb */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-300 flex-wrap">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Root
                      </span>
                      {selectedEntry.code.split('').map((bit, idx) => (
                        <React.Fragment key={idx}>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              bit === '0'
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {bit === '0' ? '0 (Left)' : '1 (Right)'}
                          </span>
                        </React.Fragment>
                      ))}
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className="text-emerald-400 font-bold">
                        Leaf [{selectedEntry.displayCharacter}]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Binary Code with Copy */}
                <div className="flex items-center gap-3">
                  <div className="bg-surface-0 border border-surface-border px-3.5 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Huffman Code:
                    </span>
                    <span className="font-mono text-emerald-300 font-bold text-sm tracking-widest">
                      {selectedEntry.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedEntry.code)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy bitstring"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHighlightedCode(null)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Clear Trace
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Code Table & Symbol Frequency Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prefix-Free Code Table Card */}
            <div className="glass-card rounded-2xl overflow-hidden border border-surface-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-surface-border gap-3 bg-surface-1/80">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    Prefix-Free Code Table
                    <Badge variant="slate" className="text-[10px]">
                      {sortedAndFilteredCodeTable.length} symbols
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click or hover rows to trace bit paths in the tree
                  </p>
                </div>

                {/* Search query input */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter symbol/code…"
                    className="w-full bg-surface-0 border border-surface-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-0 text-slate-400 sticky top-0 border-b border-surface-border z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('symbol')}
                        className="py-2.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Symbol
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Unicode</th>
                      <th
                        onClick={() => handleSort('frequency')}
                        className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Freq
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        </div>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Code</th>
                      <th
                        onClick={() => handleSort('bitLength')}
                        className="py-2.5 px-4 font-semibold cursor-pointer hover:text-slate-200 select-none text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Bits
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border font-mono">
                    {sortedAndFilteredCodeTable.map((entry) => {
                      const isRowActive = highlightedCode === entry.code;
                      return (
                        <tr
                          key={entry.codePoint}
                          onMouseEnter={() => setHighlightedCode(entry.code)}
                          onClick={() => setHighlightedCode(entry.code)}
                          className={`cursor-pointer transition-colors ${
                            isRowActive
                              ? 'bg-emerald-950/40 border-l-2 border-emerald-400'
                              : 'hover:bg-surface-2/60'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-bold text-white">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-surface-2 border border-surface-border text-xs min-w-[24px] text-center">
                              {entry.displayCharacter}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            U+{entry.codePoint.toString(16).toUpperCase().padStart(4, '0')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-semibold">
                            {entry.frequency.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold tracking-wider">
                            {entry.code}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-right">
                            <span className="px-1.5 py-0.5 rounded bg-surface-2 text-[11px]">
                              {entry.bitLength}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Frequency Bar Chart Card */}
            <div className="glass-card rounded-2xl overflow-hidden border border-surface-border">
              <div className="px-5 py-4 border-b border-surface-border bg-surface-1/80">
                <h4 className="text-sm font-semibold text-slate-100">
                  Symbol Frequency Distribution
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Top 20 most frequent characters and relative proportions
                </p>
              </div>

              <div className="p-5 h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 24 }}>
                    <defs>
                      <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
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
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}
                      formatter={(
                        value: number,
                        _name: string,
                        props: { payload?: { percentage?: string } }
                      ) => [`${value} (${props.payload?.percentage ?? ''}%)`, 'Occurrences']}
                    />
                    <Bar dataKey="frequency" fill="url(#barGlow)" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#34d399' : 'url(#barGlow)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
