import React from 'react';
import { Card } from '../components/Card';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useSessionStats } from '../hooks/useSessionStats';
import { formatDate, formatBytes } from '../utils/formatters';
import {
  FileArchive,
  FileText,
  Network,
  Cpu,
  Layers,
  Terminal,
  CheckCircle2,
  Clock,
  Activity,
  Trash2,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { status, data, error, refetch } = useHealthCheck();
  const { stats, clearSession } = useSessionStats();

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-800 to-slate-900 border border-emerald-500/20 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-3.5 h-3.5" />
            Phase 5: Full-Stack Integration Live
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Huffman Studio
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            A production-quality university-level text compression platform. Features pure{' '}
            <span className="text-emerald-400 font-medium">Java 21 Spring Boot</span> bitstream
            processing, self-contained <span className="text-emerald-400 font-medium">.huf</span>{' '}
            binary archives with CRC-32 integrity, and interactive{' '}
            <span className="text-emerald-400 font-medium">React &amp; TypeScript</span> visualizations.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/compress"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
            >
              <FileArchive className="w-4 h-4" />
              Compress Text File
            </Link>
            <Link
              to="/decompress"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Decompress .huf Archive
            </Link>
            <Link
              to="/visualizer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Network className="w-4 h-4 text-emerald-400" />
              Tree Visualizer
            </Link>
          </div>
        </div>
      </div>

      {/* Session Analytics & Live System State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backend Connectivity Status */}
        <Card title="Java 21 Backend Service" subtitle="Direct communication with Spring Boot REST API">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <span className="text-sm text-slate-400">Connection State:</span>
              <span
                className={`font-mono text-sm font-bold flex items-center gap-1.5 ${
                  status === 'UP'
                    ? 'text-emerald-400'
                    : status === 'CHECKING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'UP'
                      ? 'bg-emerald-400 animate-pulse'
                      : status === 'CHECKING'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                {status}
              </span>
            </div>

            {data && (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Message:</span>
                  <span className="font-medium text-slate-200">{data.message}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Version:</span>
                  <span className="font-mono text-emerald-400">v{data.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Ping:</span>
                  <span className="font-mono flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(data.timestamp)}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
                {error}. Run backend with <code className="text-rose-200 font-mono">./mvnw spring-boot:run</code> on port 8080.
              </div>
            )}

            <button
              onClick={() => refetch()}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Trigger Health Ping
            </button>
          </div>
        </Card>

        {/* Live Session Activity Stats */}
        <div className="lg:col-span-2">
          <Card
            title="Session Activity & Metrics"
            subtitle="Real-time compression statistics tracked across this browser session"
            headerAction={
              stats.operations.length > 0 ? (
                <button
                  onClick={clearSession}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Session
                </button>
              ) : null
            }
          >
            {stats.operations.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <Activity className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">
                  No files processed in this session yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload text files to compress or archives to decompress. All operation metrics and
                  byte savings will be tracked right here.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Link
                    to="/compress"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Open Compressor
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Total Ops
                    </span>
                    <p className="text-lg font-mono font-bold text-slate-100 mt-0.5">
                      {stats.operations.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Compressed
                    </span>
                    <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                      {stats.totalCompressed} files
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Decompressed
                    </span>
                    <p className="text-lg font-mono font-bold text-indigo-400 mt-0.5">
                      {stats.totalDecompressed} files
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Net Space Saved
                    </span>
                    <p
                      className={`text-lg font-mono font-bold mt-0.5 ${
                        stats.totalBytesSaved >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {formatBytes(stats.totalBytesSaved)}
                    </p>
                  </div>
                </div>

                {/* Operations History Table */}
                <div className="overflow-x-auto max-h-[220px] overflow-y-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">File</th>
                        <th className="py-2 px-3">Size Flow</th>
                        <th className="py-2 px-3">Ratio</th>
                        <th className="py-2 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {stats.operations.map((op) => (
                        <tr key={op.id} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                op.type === 'COMPRESS'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                  : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
                              }`}
                            >
                              {op.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 max-w-[160px] truncate" title={op.fileName}>
                            {op.fileName}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {`${formatBytes(op.originalSize)} → ${formatBytes(op.processedSize)}`}
                          </td>
                          <td className="py-2 px-3 text-slate-300 text-[11px]">
                            {op.ratio != null ? `${(op.ratio * 100).toFixed(1)}%` : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            {formatDate(op.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Grid of Technology Foundation & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Technology Stack" subtitle="Modern, decoupled engineering standards">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Java 21 Spring Boot 3</strong>
                <p className="text-xs text-slate-400">
                  Min-heap Huffman engine, pure bitstream I/O, REST endpoints
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">React 18 &amp; TypeScript</strong>
                <p className="text-xs text-slate-400">
                  Type-safe client services, binary blob downloads, interactive tree
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Tailwind CSS &amp; Recharts</strong>
                <p className="text-xs text-slate-400">
                  Clean responsive dark UI and interactive frequency charts
                </p>
              </div>
            </li>
          </ul>
        </Card>

        <Card title="Archive Specification" subtitle="Version 1 .huf Container">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">29-Byte Header</strong>
                <p className="text-xs text-slate-400">
                  Magic (0x48554646), Version, Code Points, Bit Count, Tree Bytes, Checksum
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Bit-Level Packing</strong>
                <p className="text-xs text-slate-400">
                  Variable bit codes packed into genuine 8-bit bytes using BitWriter
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Preorder Tree</strong>
                <p className="text-xs text-slate-400">
                  Topology serialized for instant reconstruction on any machine
                </p>
              </div>
            </li>
          </ul>
        </Card>

        <Card title="Key Capabilities" subtitle="Engineered for academic rigor">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Full Unicode / UTF-8</strong>
                <p className="text-xs text-slate-400">
                  Complete support for multi-byte code points, symbols, and emojis
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Byte-for-Byte Fidelity</strong>
                <p className="text-xs text-slate-400">
                  Verified with cmp and CRC-32 checksums on every round-trip
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Honest Metrics</strong>
                <p className="text-xs text-slate-400">
                  Transparent reporting of container overhead on small inputs
                </p>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
