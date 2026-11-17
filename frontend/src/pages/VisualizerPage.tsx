import React, { useState, useRef, useMemo, ChangeEvent } from 'react';
import { Card } from '../components/Card';
import { analysisService } from '../services/analysisService';
import { AnalysisResult, TreeNode } from '../types/compression';
import {
  Network,
  Upload,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Loader2,
  AlertTriangle,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Read text snippet for preview if small
      if (file.size < 100000) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setInputText(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        setInputText(`[Loaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        return {
          node,
          x,
          y: depth * depthSpacing + 50,
          isLeaf: true,
          depth,
        };
      }

      const left = node.left ? buildLayout(node.left, depth + 1) : undefined;
      const right = node.right ? buildLayout(node.right, depth + 1) : undefined;

      const x = left && right ? (left.x + right.x) / 2 : left ? left.x : right ? right.x : 0;

      return {
        node,
        x,
        y: depth * depthSpacing + 50,
        isLeaf: false,
        depth,
        left,
        right,
      };
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

  // Flatten nodes and edges for SVG rendering
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
    }> = [];

    function traverse(current: LayoutNode, currentPath: string) {
      nodes.push(current);

      if (current.left) {
        const nextCode = currentPath + '0';
        edges.push({
          x1: current.x,
          y1: current.y,
          x2: current.left.x,
          y2: current.left.y,
          bit: '0',
          childCode: nextCode,
        });
        traverse(current.left, nextCode);
      }

      if (current.right) {
        const nextCode = currentPath + '1';
        edges.push({
          x1: current.x,
          y1: current.y,
          x2: current.right.x,
          y2: current.right.y,
          bit: '1',
          childCode: nextCode,
        });
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

  // Prepare chart data (top 20 characters by frequency)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Network className="w-6 h-6 text-emerald-400" />
          Huffman Tree Visualizer &amp; Analyzer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Explore authentic Huffman trees generated in real time by the Java 21 backend, inspect
          deterministic prefix codes, and trace bit paths.
        </p>
      </div>

      {/* Input Section */}
      <Card title="Input Data for Tree Synthesis" subtitle="Analyze arbitrary text or text files">
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
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
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => {
                if (selectedFile) clearFile();
                setInputText(e.target.value);
              }}
              placeholder="Enter text or paste Unicode content here..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.csv,.json,.md,.log"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                {selectedFile ? `File: ${selectedFile.name}` : 'Upload File'}
              </button>
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

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all shadow-lg shadow-emerald-900/30"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  Building Tree in Java...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Huffman Tree
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Analysis Results Viewport */}
      {result && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Total Characters
              </span>
              <p className="text-base font-mono font-bold text-slate-100 mt-1">
                {result.characterCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Unique Symbols
              </span>
              <p className="text-base font-mono font-bold text-emerald-400 mt-1">
                {result.uniqueCharacterCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Raw Bits (8-bit)
              </span>
              <p className="text-base font-mono font-bold text-slate-100 mt-1">
                {rawBits.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Encoded Bits
              </span>
              <p className="text-base font-mono font-bold text-emerald-400 mt-1">
                {result.encodedBitCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Avg Bit Length
              </span>
              <p className="text-base font-mono font-bold text-indigo-400 mt-1">
                {avgBitLength} b/char
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                Theoretical Savings
              </span>
              <p className="text-base font-mono font-bold text-emerald-400 mt-1">
                {result.percentageSaved.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Interactive SVG Tree Viewport */}
          <Card
            title="Interactive Huffman Binary Tree"
            subtitle="Left branches represent 0 &bull; Right branches represent 1 &bull; Hover code table entries to trace path"
            headerAction={
              highlightedCode ? (
                <button
                  onClick={() => setHighlightedCode(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Trace
                </button>
              ) : null
            }
          >
            {treeLayout ? (
              <div className="w-full overflow-x-auto rounded-xl bg-slate-950/80 border border-slate-800 p-4 min-h-[420px]">
                <svg
                  width={treeLayout.totalWidth}
                  height={treeLayout.totalHeight}
                  className="mx-auto"
                >
                  {/* Edges */}
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
                          className="transition-colors duration-200"
                        />
                        {/* Bit Badge (0 or 1) */}
                        <circle
                          cx={(edge.x1 + edge.x2) / 2}
                          cy={(edge.y1 + edge.y2) / 2}
                          r={9}
                          fill={
                            isEdgeActive
                              ? '#064e3b'
                              : edge.bit === '0'
                              ? '#0f172a'
                              : '#1e1b4b'
                          }
                          stroke={
                            isEdgeActive
                              ? '#10b981'
                              : edge.bit === '0'
                              ? '#0284c7'
                              : '#a855f7'
                          }
                          strokeWidth={1}
                        />
                        <text
                          x={(edge.x1 + edge.x2) / 2}
                          y={(edge.y1 + edge.y2) / 2 + 3.5}
                          textAnchor="middle"
                          fill={isEdgeActive ? '#6ee7b7' : '#94a3b8'}
                          fontSize={10}
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
                    const isTargetLeaf =
                      highlightedCode !== null && isLeaf && highlightedCode === code;
                    const isAncestorNode =
                      highlightedCode !== null &&
                      !isLeaf &&
                      highlightedCode.startsWith(code);
                    const isDimmed =
                      highlightedCode !== null && !isTargetLeaf && !isAncestorNode;

                    if (isLeaf) {
                      return (
                        <g
                          key={`node-${idx}`}
                          className="cursor-pointer transition-transform"
                          onClick={() => setHighlightedCode(code)}
                        >
                          <rect
                            x={item.x - 30}
                            y={item.y - 18}
                            width={60}
                            height={44}
                            rx={8}
                            fill={
                              isTargetLeaf
                                ? '#047857'
                                : isDimmed
                                ? '#091512'
                                : '#064e3b'
                            }
                            stroke={
                              isTargetLeaf
                                ? '#34d399'
                                : isDimmed
                                ? '#064e3b'
                                : '#10b981'
                            }
                            strokeWidth={isTargetLeaf ? 2.5 : 1.5}
                          />
                          <text
                            x={item.x}
                            y={item.y - 1}
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize={13}
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {item.node.displayCharacter}
                          </text>
                          <text
                            x={item.x}
                            y={item.y + 15}
                            textAnchor="middle"
                            fill="#a7f3d0"
                            fontSize={10}
                            fontFamily="monospace"
                          >
                            freq: {item.node.frequency}
                          </text>
                        </g>
                      );
                    }

                    // Internal Node
                    return (
                      <g key={`node-${idx}`}>
                        <circle
                          cx={item.x}
                          cy={item.y}
                          r={18}
                          fill={
                            isAncestorNode
                              ? '#047857'
                              : isDimmed
                              ? '#090d16'
                              : '#0f172a'
                          }
                          stroke={
                            isAncestorNode
                              ? '#34d399'
                              : isDimmed
                              ? '#1e293b'
                              : '#475569'
                          }
                          strokeWidth={isAncestorNode ? 2.5 : 1.5}
                        />
                        <text
                          x={item.x}
                          y={item.y + 4}
                          textAnchor="middle"
                          fill={isAncestorNode ? '#f8fafc' : '#cbd5e1'}
                          fontSize={11}
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {item.node.frequency}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : null}
          </Card>

          {/* Lower Grid: Code Table & Frequency Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prefix Code Table */}
            <Card
              title="Prefix-Free Code Table"
              subtitle="Optimally generated variable-length bit sequences"
              headerAction={
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search symbol..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              }
            >
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Unicode</th>
                      <th className="py-2.5 px-3">Freq</th>
                      <th className="py-2.5 px-3">Huffman Code</th>
                      <th className="py-2.5 px-3">Bits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {filteredCodeTable.map((entry) => {
                      const isRowActive = highlightedCode === entry.code;
                      return (
                        <tr
                          key={entry.codePoint}
                          onMouseEnter={() => setHighlightedCode(entry.code)}
                          onClick={() => setHighlightedCode(entry.code)}
                          className={`cursor-pointer transition-colors ${
                            isRowActive
                              ? 'bg-emerald-950/60 text-emerald-200'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-white">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                              {entry.displayCharacter}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            U+{entry.codePoint.toString(16).toUpperCase().padStart(4, '0')}
                          </td>
                          <td className="py-2 px-3">{entry.frequency.toLocaleString()}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{entry.code}</td>
                          <td className="py-2 px-3 text-slate-400">{entry.bitLength}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Frequency Distribution Chart */}
            <Card
              title="Symbol Frequency Distribution"
              subtitle="Top 20 most frequent characters in sample"
            >
              <div className="h-[360px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      interval={0}
                      tick={{ fill: '#cbd5e1' }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="frequency" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
