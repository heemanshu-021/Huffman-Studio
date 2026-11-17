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
  Sparkles,
  Layers,
  RefreshCw,
  BookOpen,
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
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-[#0f1420] to-slate-900 p-7 sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.06),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="emerald" dot>
            {data?.version ? `v${data.version}` : 'Huffman Studio'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Huffman Studio
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            A production-quality text compression platform built with{' '}
            <span className="text-emerald-400 font-medium">Java 21 + Spring Boot</span> bitstream
            processing, self-contained{' '}
            <span className="text-emerald-400 font-medium">.huf binary archives</span> with CRC-32
            integrity, and interactive{' '}
            <span className="text-emerald-400 font-medium">React + TypeScript</span> visualizations.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              to="/compress"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/25"
            >
              <FileArchive className="w-4 h-4" />
              Compress File
            </Link>
            <Link
              to="/decompress"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Decompress .huf
            </Link>
            <Link
              to="/visualizer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Network className="w-4 h-4 text-emerald-400" />
              Tree Visualizer
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* Backend Status + Session Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backend card */}
        <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Java 21 Backend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Spring Boot REST API</p>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                status === 'UP'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'CHECKING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <span className="text-xs text-slate-500">Status</span>
              <span
                className={`text-xs font-mono font-bold ${
                  status === 'UP'
                    ? 'text-emerald-400'
                    : status === 'CHECKING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {status}
              </span>
            </div>
            {data && (
              <>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-500">Message</span>
                  <span className="text-xs text-slate-300 font-medium">{data.message}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-500">Version</span>
                  <span className="text-xs font-mono text-emerald-400">v{data.version}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-500">Last Ping</span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(data.timestamp)}
                  </span>
                </div>
              </>
            )}
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 mt-2">
                {error}. Start backend with{' '}
                <code className="text-rose-200 font-mono">./mvnw spring-boot:run</code>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="w-full text-slate-500 hover:text-slate-300"
          >
            Ping Health
          </Button>
        </div>

        {/* Session Stats */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Session Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Operations tracked this browser session</p>
            </div>
            {stats.operations.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearSession}
                leftIcon={<Trash2 className="w-3 h-3" />}
                className="text-slate-500 hover:text-rose-400"
              >
                Clear
              </Button>
            )}
          </div>

          {stats.operations.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-6 h-6" />}
              title="No activity yet"
              description="Upload text files to compress or .huf archives to decompress. All metrics are tracked here."
              action={
                <Link
                  to="/compress"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Open Compressor
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Operations" value={stats.operations.length} accent="slate" />
                <MetricCard
                  label="Compressed"
                  value={`${stats.totalCompressed}`}
                  sub="files"
                  accent="emerald"
                />
                <MetricCard
                  label="Decompressed"
                  value={`${stats.totalDecompressed}`}
                  sub="files"
                  accent="indigo"
                />
                <MetricCard
                  label="Space Saved"
                  value={formatBytes(stats.totalBytesSaved)}
                  accent={stats.totalBytesSaved >= 0 ? 'emerald' : 'amber'}
                />
              </div>

              <div className="rounded-lg border border-slate-800/60 overflow-hidden">
                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 text-slate-500 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="text-[10px] uppercase tracking-wider py-2 px-3 font-semibold">Type</th>
                        <th className="text-[10px] uppercase tracking-wider py-2 px-3 font-semibold">File</th>
                        <th className="text-[10px] uppercase tracking-wider py-2 px-3 font-semibold">Size Flow</th>
                        <th className="text-[10px] uppercase tracking-wider py-2 px-3 font-semibold">Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono">
                      {stats.operations.map((op) => (
                        <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3">
                            <Badge
                              variant={op.type === 'COMPRESS' ? 'emerald' : 'indigo'}
                              className="text-[10px]"
                            >
                              {op.type}
                            </Badge>
                          </td>
                          <td
                            className="py-2 px-3 text-xs text-slate-300 max-w-[140px] truncate"
                            title={op.fileName}
                          >
                            {op.fileName}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">
                            {formatBytes(op.originalSize)} → {formatBytes(op.processedSize)}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {op.ratio != null ? `${(op.ratio * 100).toFixed(1)}%` : '—'}
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

      {/* Tech info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Technology Stack</h4>
          <ul className="space-y-3">
            {[
              {
                icon: <Cpu className="w-4 h-4 text-emerald-400" />,
                title: 'Java 21 Spring Boot 3',
                desc: 'Min-heap Huffman engine, pure bitstream I/O, REST endpoints',
              },
              {
                icon: <Layers className="w-4 h-4 text-emerald-400" />,
                title: 'React 18 + TypeScript',
                desc: 'Type-safe client services, binary blob downloads, interactive tree',
              },
              {
                icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
                title: 'Tailwind CSS + Recharts',
                desc: 'Premium dark UI and interactive frequency charts',
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archive Spec (.huf v1)</h4>
          <div className="space-y-1 font-mono text-xs">
            {[
              { label: 'Magic', value: '0x48554646 (HUFF)', em: true },
              { label: 'Version', value: '0x01', em: false },
              { label: 'Header', value: '29 Bytes Fixed', em: false },
              { label: 'Integrity', value: 'CRC-32 IEEE 802.3', em: false },
              { label: 'Tree', value: 'Preorder Bit Sequence', em: false },
            ].map(({ label, value, em }) => (
              <div
                key={label}
                className="flex justify-between py-1.5 border-b border-slate-800/40 last:border-0"
              >
                <span className="text-slate-500">{label}</span>
                <span className={em ? 'text-emerald-400' : 'text-slate-300'}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#14141c] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Key Capabilities</h4>
          <ul className="space-y-3">
            {[
              { title: 'Full Unicode / UTF-8', desc: 'Multi-byte code points, symbols, and emojis' },
              { title: 'Byte-for-Byte Fidelity', desc: 'CRC-32 checksums on every round-trip' },
              { title: 'Honest Metrics', desc: 'Transparent container overhead reporting' },
            ].map(({ title, desc }) => (
              <li key={title} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">{title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
