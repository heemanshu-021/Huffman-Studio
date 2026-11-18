import React, { useState } from 'react';
import {
  FileArchive,
  FileText,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  HardDrive,
  Binary,
  Layers,
  ShieldCheck,
  Zap,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { compressionService } from '../services/compressionService';
import { useSessionStats } from '../hooks/useSessionStats';
import { useToast } from '../components/ui/Toast';
import { CompressionResult } from '../types/compression';
import { formatBytes } from '../utils/formatters';
import { StepIndicator } from '../components/ui/StepIndicator';
import { MetricCard } from '../components/ui/MetricCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SectionHeader } from '../components/ui/SectionHeader';

const WORKFLOW_STEPS = [
  { label: 'Select Input', description: 'Upload plain text' },
  { label: 'Bitstream Packing', description: 'Run Huffman engine' },
  { label: 'Download .huf', description: 'Save binary archive' },
];

export const CompressorPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStage, setCompressionStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const { recordOperation } = useSessionStats();
  const toast = useToast();

  const currentStep = result ? 2 : selectedFile ? 1 : 0;

  const validateAndSetFile = (file: File) => {
    setError(null);
    setResult(null);

    // 50 MB safety limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`File size (${formatBytes(file.size)}) exceeds the maximum 50 MB threshold.`);
      return;
    }

    setSelectedFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    setCompressionStage('');
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setError(null);
    setCompressionStage('1/4: Validating UTF-8 input…');

    try {
      // Meaningful stage progression feedback while awaiting backend execution
      setTimeout(() => setCompressionStage('2/4: Computing code-point frequencies…'), 120);
      setTimeout(() => setCompressionStage('3/4: Building min-heap & prefix codes…'), 280);
      setTimeout(() => setCompressionStage('4/4: Packing bitstream & writing CRC-32 header…'), 420);

      const res = await compressionService.compressFile(selectedFile);
      setResult(res);

      recordOperation({
        type: 'COMPRESS',
        fileName: selectedFile.name,
        originalSize: res.stats.originalBytes,
        processedSize: res.stats.archiveBytes,
        ratio: res.stats.compressionRatio,
        savingsPercent: res.stats.percentageSaved,
      });

      // Trigger download
      compressionService.downloadBlob(res.blob, res.filename);
      toast.success('Archive Generated!', `${res.filename} (${formatBytes(res.stats.archiveBytes)}) downloaded.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during compression.';
      setError(msg);
      toast.error('Compression Failed', msg);
    } finally {
      setIsCompressing(false);
      setCompressionStage('');
    }
  };

  const handleManualDownload = () => {
    if (!result) return;
    compressionService.downloadBlob(result.blob, result.filename);
    toast.info('Downloading Archive', result.filename);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <SectionHeader
        title="Text File Compressor"
        description="Transform raw UTF-8 plain text files into genuine, self-contained .huf binary archives with embedded tree structures and CRC-32 integrity validation."
        icon={<FileArchive className="w-5 h-5" />}
        badge={
          <Badge variant="emerald" dot>
            HUFN Container
          </Badge>
        }
      />

      {/* Workflow Step Tracker */}
      <div className="rounded-2xl border border-surface-border bg-surface-card p-5">
        <StepIndicator steps={WORKFLOW_STEPS} currentStep={currentStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Compression Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Selection Card */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-5">
            {!selectedFile ? (
              <FileDropzone
                onFileSelected={validateAndSetFile}
                accept=".txt,.csv,.json,.md,.log,.xml,.yaml,.yml,text/*"
                title="Select or drop a plain text file"
                subtitle="Accepts UTF-8 plain text files (.txt, .md, .json, source files) up to 50 MB"
                supportedFormatsText="UTF-8 Plain Text (.txt, .md, .json, .csv) · Max 50 MB"
                icon={<FileArchive className="w-8 h-8" />}
              />
            ) : (
              <div className="space-y-5">
                {/* Selected File Details Bar */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-surface-border/80">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {formatBytes(selectedFile.size)} · {selectedFile.type || 'text/plain'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    disabled={isCompressing}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                    title="Remove selected file"
                    aria-label="Remove selected file"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Compression Progress Feedback */}
                {isCompressing && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-pulse">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-300 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        Executing Java 21 Bitstream Engine…
                      </span>
                      <span className="font-mono text-emerald-400 text-[11px]">{compressionStage}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-3/4 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Compress Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCompress}
                  disabled={isCompressing}
                  loading={isCompressing}
                  leftIcon={<FileArchive className="w-4 h-4" />}
                  className="w-full text-sm font-bold shadow-glow-emerald"
                >
                  {isCompressing ? 'Encoding & Packing Archive…' : 'Compress to .huf Archive'}
                </Button>
              </div>
            )}

            {/* Error Feedback */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-rose-200">Compression Failed</p>
                  <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* RESULTS PANEL (Visible after successful compression)     */}
          {/* ======================================================== */}
          {result && (
            <div className="rounded-2xl border border-emerald-500/30 bg-surface-card p-6 space-y-6 shadow-glow-card animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      Compression Completed
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Generated: {result.filename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleManualDownload}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download .huf
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Compress Another
                  </Button>
                </div>
              </div>

              {/* Visual Size Comparison Bar */}
              <div className="space-y-2 p-4 rounded-xl bg-surface-2 border border-surface-border">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Original: {formatBytes(result.stats.originalBytes)}</span>
                  <span className="font-mono text-emerald-400">
                    Archive: {formatBytes(result.stats.archiveBytes)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-0 overflow-hidden flex border border-surface-border/80">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (result.stats.archiveBytes / Math.max(result.stats.originalBytes, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Archive constitutes{' '}
                  <strong className="text-slate-200">
                    {(
                      (result.stats.archiveBytes / Math.max(result.stats.originalBytes, 1)) *
                      100
                    ).toFixed(1)}%
                  </strong>{' '}
                  of original uncompressed size
                </p>
              </div>

              {/* Primary 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Original Size"
                  value={formatBytes(result.stats.originalBytes)}
                  sub="Plain text"
                  accent="slate"
                />
                <MetricCard
                  label="Archive Size"
                  value={formatBytes(result.stats.archiveBytes)}
                  sub="Binary .huf"
                  accent="emerald"
                />
                <MetricCard
                  label="Space Saved"
                  value={formatBytes(result.stats.bytesSaved)}
                  sub={result.stats.bytesSaved >= 0 ? 'Net reduction' : 'Container overhead'}
                  accent={result.stats.bytesSaved >= 0 ? 'emerald' : 'amber'}
                />
                <MetricCard
                  label="Ratio"
                  value={
                    result.stats.compressionRatio > 0
                      ? `${(result.stats.compressionRatio * 100).toFixed(1)}%`
                      : 'N/A'
                  }
                  sub="Efficiency"
                  accent="cyan"
                />
              </div>

              {/* Container Overhead Notice for Small Files */}
              {result.stats.bytesSaved < 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3 text-xs text-amber-200">
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-300">Container Overhead Notice</p>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      The generated archive is slightly larger than the raw original input. In authentic lossless
                      compressors, the standalone container overhead (<strong>29-byte fixed header</strong> + serialized tree
                      metadata) exceeds bit-level savings on small inputs. As document size increases, payload savings
                      dramatically outweigh this constant overhead.
                    </p>
                  </div>
                </div>
              )}

              {/* Archive Binary Breakdown */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Binary Archive Structure Breakdown
                  </h4>
                  <Badge variant="slate">Specification V1</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    {
                      icon: <HardDrive className="w-3.5 h-3.5 text-emerald-400" />,
                      label: 'Header Metadata',
                      value: `${result.stats.headerBytes} B (29B Fixed + ${result.stats.treeBytes}B Tree)`,
                    },
                    {
                      icon: <Binary className="w-3.5 h-3.5 text-cyan-400" />,
                      label: 'Encoded Payload',
                      value: `${result.stats.payloadBits} bits (${result.stats.payloadBytes} B)`,
                    },
                    {
                      icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
                      label: 'Serialized Tree',
                      value: `${result.stats.treeBytes} Bytes (Preorder DFS)`,
                    },
                    {
                      icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
                      label: 'Percentage Saved',
                      value: `${result.stats.percentageSaved.toFixed(2)}%`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-surface-border/70"
                    >
                      <span className="text-slate-400 flex items-center gap-2 text-[11px]">
                        {item.icon}
                        {item.label}
                      </span>
                      <span className="text-slate-100 font-semibold text-[11px]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Architectural Guidance & Specifications */}
        <div className="space-y-6">
          {/* How It Compresses Card */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Algorithmic Pipeline
              </h4>
            </div>
            <ol className="space-y-3 text-xs text-slate-400">
              {[
                ['Frequency Counting', 'Scans raw UTF-8 bytes to compute symbol occurrence probabilities.'],
                ['Min-Heap PriorityQueue', 'Greedily pairs two lowest-frequency nodes into subtree merges.'],
                ['Prefix Code Generation', 'Assigns variable-length bit codes (0 = left, 1 = right).'],
                ['BitWriter Byte Packing', 'Packs variable bits into genuine 8-bit bytes with MSB alignment.'],
                ['CRC-32 Checksumming', 'Embeds 32-bit verification hash for zero-loss recovery.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-slate-200 font-medium">{title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="pt-3 border-t border-surface-border flex items-center gap-2 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Lossless &bull; Pure Java 21 Engine</span>
            </div>
          </div>

          {/* Archive Specification Card */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                  Archive Spec (.huf v1)
                </h4>
              </div>
              <Badge variant="cyan">HUFN</Badge>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                ['Magic Header', '0x4855464E (HUFN)', true],
                ['Format Version', '0x01', false],
                ['Header Length', '29 Bytes Fixed', false],
                ['Integrity Hash', 'CRC-32 (IEEE 802.3)', false],
                ['Tree Structure', 'Preorder Bit Sequence', false],
                ['Padding Mode', '0–7 Bits MSB Aligned', false],
              ].map(([label, value, em]) => (
                <div
                  key={label as string}
                  className="flex justify-between py-1.5 border-b border-surface-border/50 last:border-0"
                >
                  <span className="text-slate-400 text-[11px]">{label}</span>
                  <span className={`text-[11px] ${em ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
