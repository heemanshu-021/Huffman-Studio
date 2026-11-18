import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  FileArchive,
  UploadCloud,
  FileText,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  HardDrive,
  Binary,
  Layers,
} from 'lucide-react';
import { compressionService } from '../services/compressionService';
import { useSessionStats } from '../hooks/useSessionStats';
import { useToast } from '../components/ui/Toast';
import { CompressionResult } from '../types/compression';
import { formatBytes } from '../utils/formatters';
import { StepIndicator } from '../components/ui/StepIndicator';
import { MetricCard } from '../components/ui/MetricCard';
import { Button } from '../components/ui/Button';

const STEPS = [
  { label: 'Select', description: 'Choose text file' },
  { label: 'Compress', description: 'Run Huffman engine' },
  { label: 'Download', description: 'Save .huf archive' },
];

export const CompressorPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recordOperation } = useSessionStats();
  const toast = useToast();

  const currentStep = result ? 2 : selectedFile ? 1 : 0;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setResult(null);
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`File size (${formatBytes(file.size)}) exceeds the 50 MB limit.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndSetFile(e.target.files[0]);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setIsCompressing(true);
    setError(null);
    try {
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
      compressionService.downloadBlob(res.blob, res.filename);
      toast.success('Archive created!', `${res.filename} has been downloaded.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      toast.error('Compression failed', msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleManualDownload = () => {
    if (!result) return;
    compressionService.downloadBlob(result.blob, result.filename);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <FileArchive className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">Text File Compressor</h2>
        </div>
        <p className="text-sm text-slate-400">
          Upload plain text files to generate genuine bit-packed{' '}
          <code className="text-emerald-400 font-mono text-xs">.huf</code> archives.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} className="max-w-lg" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upload card */}
          <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.csv,.json,.md,.log,.xml,.yaml,.yml,text/*"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/8 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/40'
                }`}
              >
                <UploadCloud
                  className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                    isDragging ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
                <h3 className="text-sm font-semibold text-slate-200">
                  {isDragging ? 'Drop file to upload' : 'Drag & drop text file here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  Supports UTF-8 encoded files (.txt, .md, .json, source files) up to 50 MB
                </p>
                <Button variant="primary" size="sm">
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {formatBytes(selectedFile.size)} · {selectedFile.type || 'text/plain'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    disabled={isCompressing}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCompress}
                  disabled={isCompressing}
                  loading={isCompressing}
                  leftIcon={<FileArchive className="w-4 h-4" />}
                  className="w-full"
                >
                  {isCompressing ? 'Compressing with Java Engine…' : 'Compress to .huf Archive'}
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-rose-200">Compression Error</p>
                  <p className="text-xs text-rose-300 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-xl border border-emerald-500/20 bg-[#14141c] p-5 space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Compression Complete</h3>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleManualDownload}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download .huf
                </Button>
              </div>

              {/* Size comparison bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Original: {formatBytes(result.stats.originalBytes)}</span>
                  <span>Archive: {formatBytes(result.stats.archiveBytes)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (result.stats.archiveBytes / Math.max(result.stats.originalBytes, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Archive is{' '}
                  {(
                    (result.stats.archiveBytes / Math.max(result.stats.originalBytes, 1)) *
                    100
                  ).toFixed(1)}
                  % of original size
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Original"
                  value={formatBytes(result.stats.originalBytes)}
                  accent="slate"
                />
                <MetricCard
                  label="Archive"
                  value={formatBytes(result.stats.archiveBytes)}
                  accent="emerald"
                />
                <MetricCard
                  label="Space Saved"
                  value={formatBytes(result.stats.bytesSaved)}
                  accent={result.stats.bytesSaved >= 0 ? 'emerald' : 'amber'}
                />
                <MetricCard
                  label="Ratio"
                  value={
                    result.stats.compressionRatio > 0
                      ? `${(result.stats.compressionRatio * 100).toFixed(1)}%`
                      : 'N/A'
                  }
                  accent="indigo"
                />
              </div>

              {result.stats.bytesSaved < 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-300">Container Overhead Notice</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      The archive is larger than the original. In genuine lossless compressors, the
                      self-contained container overhead (29-byte header + tree serialization) exceeds
                      bit savings on small inputs. As input size grows, compression efficiency scales
                      rapidly.
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800/60 pt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Archive Binary Breakdown
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    {
                      icon: <HardDrive className="w-3.5 h-3.5" />,
                      label: 'Header Metadata',
                      value: `${result.stats.headerBytes}B (29B Fixed + ${result.stats.treeBytes}B Tree)`,
                    },
                    {
                      icon: <Binary className="w-3.5 h-3.5" />,
                      label: 'Encoded Payload',
                      value: `${result.stats.payloadBits} bits (${result.stats.payloadBytes}B)`,
                    },
                    {
                      icon: <Layers className="w-3.5 h-3.5" />,
                      label: 'Tree Metadata',
                      value: `${result.stats.treeBytes} Bytes`,
                    },
                    {
                      icon: <FileText className="w-3.5 h-3.5" />,
                      label: 'Percentage Saved',
                      value: `${result.stats.percentageSaved.toFixed(2)}%`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800"
                    >
                      <span className="text-slate-500 flex items-center gap-1.5">
                        {item.icon}
                        {item.label}
                      </span>
                      <span className="text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              How It Works
            </h4>
            <ol className="space-y-3 text-xs text-slate-400">
              {[
                ['Frequency Analysis', 'Each Unicode code point counted for optimal prefix codes'],
                ['Min-Heap Tree', 'Priority queue pairs lowest-frequency nodes'],
                ['Bitstream Packing', 'Variable-length bits packed into real 8-bit bytes'],
                ['Self-Contained Header', 'Tree + CRC-32 embedded in archive'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-slate-200 font-medium">{title}</p>
                    <p className="text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="pt-2 border-t border-slate-800/50 flex items-center gap-1.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero cloud dependency · Pure Java 21 engine
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Archive Format (.huf v1)
            </h4>
            <div className="space-y-1 text-xs font-mono">
              {[
                ['Magic Number', '0x4855464E (HUFN)', true],
                ['Version', '0x01', false],
                ['Header Size', '29 Bytes Fixed', false],
                ['Integrity', 'CRC-32 IEEE 802.3', false],
                ['Tree Serial.', 'Preorder Bit Seq.', false],
              ].map(([label, value, em]) => (
                <div
                  key={label as string}
                  className="flex justify-between py-1.5 border-b border-slate-800/40 last:border-0"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className={em ? 'text-emerald-400' : 'text-slate-300'}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
