import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Card } from '../components/Card';
import { compressionService } from '../services/compressionService';
import { useSessionStats } from '../hooks/useSessionStats';
import { CompressionResult } from '../types/compression';
import { formatBytes } from '../utils/formatters';
import {
  FileArchive,
  UploadCloud,
  FileText,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  HardDrive,
  Binary,
  Layers,
} from 'lucide-react';

export const CompressorPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recordOperation } = useSessionStats();

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

    // Limit check: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`File size (${formatBytes(file.size)}) exceeds the maximum allowed 50MB limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      // Automatically trigger download of the .huf archive
      compressionService.downloadBlob(res.blob, res.filename);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred during compression.';
      setError(errorMessage);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleManualDownload = () => {
    if (!result) return;
    compressionService.downloadBlob(result.blob, result.filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <FileArchive className="w-6 h-6 text-emerald-400" />
          Text File Compressor
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload plain text files to generate genuine bit-packed{' '}
          <code className="text-emerald-400 font-mono">.huf</code> archives with custom binary headers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            {/* Hidden File Input */}
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
                    ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-900/40'
                }`}
              >
                <UploadCloud
                  className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                    isDragging ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <h3 className="text-base font-semibold text-slate-200">
                  {isDragging ? 'Drop file to upload' : 'Drag & drop text file here'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports UTF-8 encoded files (.txt, .md, .json, source files) up to 50MB
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
                  >
                    Browse Files
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Details Bar */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-700/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">
                        {selectedFile.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'text/plain'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    disabled={isCompressing}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Compress Button */}
                <button
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      Compressing with Java Engine...
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-4 h-4" />
                      Compress to .huf Archive
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-rose-200">Compression Error</span>
                  <p className="leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Results Card */}
          {result && (
            <Card
              title="Compression Complete"
              subtitle={`Archive: ${result.filename}`}
              headerAction={
                <button
                  onClick={handleManualDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .huf
                </button>
              }
            >
              <div className="space-y-6">
                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-xs text-slate-400">Original Size</span>
                    <p className="text-lg font-mono font-bold text-slate-100 mt-1">
                      {formatBytes(result.stats.originalBytes)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-xs text-slate-400">Archive Size</span>
                    <p className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      {formatBytes(result.stats.archiveBytes)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-xs text-slate-400">Space Saved</span>
                    <p
                      className={`text-lg font-mono font-bold mt-1 ${
                        result.stats.bytesSaved >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {formatBytes(result.stats.bytesSaved)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-xs text-slate-400">Ratio</span>
                    <p className="text-lg font-mono font-bold text-indigo-400 mt-1">
                      {result.stats.compressionRatio > 0
                        ? `${(result.stats.compressionRatio * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Educational Notice for Small Files (Negative Savings) */}
                {result.stats.bytesSaved < 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3 text-xs text-amber-200">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Container Overhead Notice:</strong>
                      <p className="mt-1 text-slate-300 leading-relaxed">
                        The compressed archive is larger than the raw original text. In genuine
                        lossless compressors, the self-contained container overhead (29-byte fixed
                        header + serialized tree topology) exceeds bit savings on small inputs. As
                        input text size grows, compression efficiency scales rapidly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Detailed Archive Breakdown */}
                <div className="border-t border-slate-700/60 pt-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Archive Binary Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        Header Metadata
                      </span>
                      <span className="font-mono text-slate-200">
                        {result.stats.headerBytes} B (29B Fixed + {result.stats.treeBytes}B Tree)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Binary className="w-3.5 h-3.5 text-slate-500" />
                        Encoded Payload
                      </span>
                      <span className="font-mono text-slate-200">
                        {result.stats.payloadBits} bits ({result.stats.payloadBytes} B)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        Tree Metadata
                      </span>
                      <span className="font-mono text-slate-200">
                        {result.stats.treeBytes} Bytes
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Percentage Saved
                      </span>
                      <span className="font-mono text-emerald-400">
                        {result.stats.percentageSaved.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Specification & Guidance */}
        <div className="space-y-6">
          <Card title="How It Works" subtitle="True Bit-Level Compression">
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Huffman Studio never simulates compression. Your file undergoes genuine byte packing:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-400">
                <li>
                  <strong className="text-slate-200">Frequency Analysis:</strong> Each Unicode code
                  point is counted to build optimal prefix codes.
                </li>
                <li>
                  <strong className="text-slate-200">Min-Heap Tree:</strong> Deterministic priority
                  queue pairs lowest-frequency nodes.
                </li>
                <li>
                  <strong className="text-slate-200">Bitstream Packing:</strong> Variable-length bits
                  are packed into authentic 8-bit bytes using <code className="text-emerald-400">BitWriter</code>.
                </li>
                <li>
                  <strong className="text-slate-200">Self-Contained Header:</strong> Tree topology and
                  CRC-32 are embedded so the archive can be decompressed anywhere.
                </li>
              </ol>

              <div className="pt-3 border-t border-slate-700/50 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero cloud dependency &bull; Pure Java 21 engine</span>
              </div>
            </div>
          </Card>

          <Card title="Archive Format (.huf)" subtitle="Specification V1">
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Magic Number</span>
                <span className="text-emerald-400">HUFF (0x48554646)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Version</span>
                <span className="text-slate-300">0x01</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Header Size</span>
                <span className="text-slate-300">29 Bytes Fixed</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Integrity</span>
                <span className="text-slate-300">CRC-32 IEEE 802.3</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tree Serialization</span>
                <span className="text-slate-300">Preorder Bit Sequence</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
