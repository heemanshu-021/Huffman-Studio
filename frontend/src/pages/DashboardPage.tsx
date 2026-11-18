import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileArchive,
  FileText,
  Network,
  Clock,
  Activity,
  Trash2,
  CheckCircle2,
  Cpu,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useSessionStats } from '../hooks/useSessionStats';
import { formatDate, formatBytes } from '../utils/formatters';
import { MetricCard } from '../components/ui/MetricCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { status, data, error, refetch } = useHealthCheck();
  const { stats, clearSession } = useSessionStats();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-surface-card via-surface-1 to-surface-0 p-8 sm:p-12 shadow-glow-card">
        {/* Subtle decorative radial lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/[0.05] rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="emerald" dot>
              {data?.version ? `Huffman Engine v${data.version}` : 'Engine Ready'}
            </Badge>
            <Badge variant="cyan">
              Bit-Level Packing
            </Badge>
            <Badge variant="slate">
              CRC-32 Validated
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Lossless Compression. <br />
              <span className="text-gradient-emerald">Authentic Bitstream Packing.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl pt-1">
              A high-performance text compression suite powered by pure{' '}
              <strong className="text-white font-semibold">Java 21 Spring Boot</strong> bitstream I/O,
              generating self-contained <code className="text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">.huf</code> binary
              archives with embedded tree topologies and CRC-32 integrity.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link to="/compress">
              <Button
                variant="primary"
                size="md"
                leftIcon={<FileArchive className="w-4 h-4" />}
              >
                Compress Text File
              </Button>
            </Link>
            <Link to="/decompress">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<FileText className="w-4 h-4 text-emerald-400" />}
              >
                Decompress .huf Archive
              </Button>
            </Link>
            <Link to="/visualizer">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Network className="w-4 h-4" />}
              >
                Interactive Tree Visualizer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ENGINE HEALTH & SESSION METRICS                           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backend Health Card */}
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Java 21 Engine</h3>
                  <p className="text-[11px] text-slate-400">Spring Boot 3.3.5 Runtime</p>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'UP'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : status === 'CHECKING'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
            </div>

            <div className="space-y-3 pt-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-surface-border/40">
                <span className="text-slate-400">Status</span>
                <span
                  className={`font-mono font-bold ${
                    status === 'UP'
                      ? 'text-emerald-400'
                      : status === 'CHECKING'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {status === 'UP' ? 'CONNECTED' : status === 'CHECKING' ? 'CONNECTING' : 'DISCONNECTED'}
                </span>
              </div>
              {data && (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-surface-border/40">
                    <span className="text-slate-400">Service</span>
                    <span className="text-slate-200 font-medium">{data.message}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-surface-border/40">
                    <span className="text-slate-400">Version</span>
                    <span className="font-mono text-emerald-400">v{data.version}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Last Ping</span>
                    <span className="font-mono text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatDate(data.timestamp)}
                    </span>
                  </div>
                </>
              )}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
                  {error}. Start backend with{' '}
                  <code className="text-rose-200 font-mono">./mvnw spring-boot:run</code>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
            className="w-full text-slate-300"
          >
            Trigger Health Probe
          </Button>
        </div>

        {/* Live Session Analytics Container */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-surface-card p-6 flex flex-col justify-between space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border/80">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Live Session Metrics</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time compression operations tracked across this active browser session
              </p>
            </div>
            {stats.operations.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearSession}
                leftIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                className="text-slate-400 hover:text-rose-400"
              >
                Clear
              </Button>
            )}
          </div>

          {stats.operations.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-7 h-7 text-slate-500" />}
              title="No Operations in this Session Yet"
              description="Upload text files to compress or .huf binary archives to decompress. All real byte savings and ratio metrics will appear here in real time."
              action={
                <Link to="/compress">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Compressor
                  </Button>
                </Link>
              }
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Total Ops"
                  value={stats.operations.length}
                  sub="Processed"
                  accent="slate"
                />
                <MetricCard
                  label="Compressed"
                  value={stats.totalCompressed}
                  sub="Text files"
                  accent="emerald"
                />
                <MetricCard
                  label="Decompressed"
                  value={stats.totalDecompressed}
                  sub="Archives"
                  accent="cyan"
                />
                <MetricCard
                  label="Net Saved"
                  value={formatBytes(stats.totalBytesSaved)}
                  sub={stats.totalBytesSaved >= 0 ? 'Space reduction' : 'Container overhead'}
                  accent={stats.totalBytesSaved >= 0 ? 'emerald' : 'amber'}
                />
              </div>

              {/* History Table */}
              <div className="rounded-xl border border-surface-border overflow-hidden bg-surface-0/60">
                <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 text-slate-400 sticky top-0 border-b border-surface-border font-mono text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Filename</th>
                        <th className="py-2 px-3">Size Flow</th>
                        <th className="py-2 px-3">Ratio</th>
                        <th className="py-2 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 font-mono text-slate-300">
                      {stats.operations.map((op) => (
                        <tr key={op.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3">
                            <Badge
                              variant={op.type === 'COMPRESS' ? 'emerald' : 'cyan'}
                              className="text-[10px]"
                            >
                              {op.type}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-slate-200 max-w-[140px] truncate" title={op.fileName}>
                            {op.fileName}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {formatBytes(op.originalSize)} → {formatBytes(op.processedSize)}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-emerald-400 font-semibold">
                            {op.ratio != null ? `${(op.ratio * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2 px-3 text-[10px] text-slate-500">
                            {formatDate(op.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. QUICK NAVIGATION CARDS                                    */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Core Workspaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/compress"
            className="group rounded-2xl border border-surface-border bg-surface-card p-5 hover:border-emerald-500/40 hover:bg-surface-elevated transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <FileArchive className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Compressor Workspace
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload UTF-8 text files to generate genuine bitstream-packed <code className="text-emerald-400">.huf</code> archives.
              </p>
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-400 gap-1 pt-1">
              <span>Open Compressor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/decompress"
            className="group rounded-2xl border border-surface-border bg-surface-card p-5 hover:border-cyan-500/40 hover:bg-surface-elevated transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                Decompressor Workspace
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restore exact original text with bit-for-bit CRC-32 integrity checking and live preview.
              </p>
            </div>
            <div className="flex items-center text-xs font-medium text-cyan-400 gap-1 pt-1">
              <span>Open Decompressor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/visualizer"
            className="group rounded-2xl border border-surface-border bg-surface-card p-5 hover:border-emerald-500/40 hover:bg-surface-elevated transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Tree Visualizer Canvas
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect dynamic Huffman trees, trace root-to-leaf paths, and explore symbol frequencies.
              </p>
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-400 gap-1 pt-1">
              <span>Explore Visualizer</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/how-it-works"
            className="group rounded-2xl border border-surface-border bg-surface-card p-5 hover:border-indigo-500/40 hover:bg-surface-elevated transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                Algorithmic Reference
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step walkthrough of greedy min-heap pairing, BitWriter mechanics, and archive offsets.
              </p>
            </div>
            <div className="flex items-center text-xs font-medium text-indigo-400 gap-1 pt-1">
              <span>Read Documentation</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TECHNICAL SPECIFICATION & CONTAINER FOUNDATIONS           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-3.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Architecture Standards
            </h4>
          </div>
          <ul className="space-y-3">
            {[
              {
                title: 'Java 21 Spring Boot 3 Engine',
                desc: 'Min-heap tree builder, pure bitstream I/O with BitWriter, streaming REST controllers.',
              },
              {
                title: 'React 18 + TypeScript Client',
                desc: 'Type-safe contracts, binary blob stream handling, reactive session tracking.',
              },
              {
                title: 'Tailwind CSS + Recharts Canvas',
                desc: 'High-density developer theme, responsive SVG viewport, symbol frequency analytics.',
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Archive Specification (.huf v1)
            </h4>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {[
              { label: 'Magic Header', value: 'HUFN (0x4855464E)', em: true },
              { label: 'Version', value: '0x01 (Version 1)', em: false },
              { label: 'Fixed Header', value: '29 Bytes Total', em: false },
              { label: 'Integrity Check', value: 'CRC-32 (IEEE 802.3)', em: false },
              { label: 'Tree Encoding', value: 'Preorder DFS Sequence', em: false },
            ].map(({ label, value, em }) => (
              <div
                key={label}
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

        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Algorithmic Guarantees
            </h4>
          </div>
          <ul className="space-y-3">
            {[
              {
                title: 'Full Unicode Spectrum',
                desc: 'Operates on 32-bit Unicode code points supporting Indic, CJK, Arabic, and emojis.',
              },
              {
                title: 'Byte-for-Byte Fidelity',
                desc: 'Exact byte identity confirmed on decompression; zero perceptual or information loss.',
              },
              {
                title: 'Honest Container Metrics',
                desc: 'Transparently accounts for 29B header + tree overhead on small files.',
              },
            ].map(({ title, desc }, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">{title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
