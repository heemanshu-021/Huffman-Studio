import React from 'react';
import { Card } from '../components/Card';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { formatDate } from '../utils/formatters';
import {
  FileArchive,
  Network,
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { status, data, error, refetch } = useHealthCheck();

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-800 to-slate-900 border border-emerald-500/20 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Layers className="w-3.5 h-3.5" />
            Phase 1: Foundation &amp; Architecture Active
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Huffman Studio
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            A full-stack, university-level text compression application powered by an authentic{' '}
            <span className="text-emerald-400 font-medium">Java 21</span> implementation of the
            lossless Huffman Coding algorithm, paired with an interactive{' '}
            <span className="text-emerald-400 font-medium">React &amp; TypeScript</span> dashboard.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/30"
            >
              Learn Algorithm Flow
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/visualizer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Network className="w-4 h-4 text-emerald-400" />
              Preview Tree Visualizer
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of System State & Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend Connectivity Status */}
        <Card title="Backend Service Status" subtitle="Direct communication with Java 21 REST API">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <span className="text-sm text-slate-400">Connection State:</span>
              <span
                className={`font-mono text-sm font-bold ${
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

        {/* Technology Foundation */}
        <Card title="Technology Stack" subtitle="Modern, decoupled engineering standards">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Java 21 Spring Boot 3</strong>
                <p className="text-xs text-slate-400">Greedy min-heap Huffman engine with Maven Wrapper</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">React 18 &amp; TypeScript</strong>
                <p className="text-xs text-slate-400">Type-safe components, custom hooks &amp; modular architecture</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Tailwind CSS &amp; Vite</strong>
                <p className="text-xs text-slate-400">Lightning-fast HMR and responsive dark-mode styling</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Architectural Highlights */}
        <Card title="Architecture Principles" subtitle="Adhering to strict university-level criteria">
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Authentic Bitstream I/O</strong>
                <p className="text-xs text-slate-400">Zero simulation: genuine bit-level compression into .huf archives</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Stateless REST Protocols</strong>
                <p className="text-xs text-slate-400">Autonomous files preserve metadata for post-restart recovery</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <FileArchive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Clean Layer Separation</strong>
                <p className="text-xs text-slate-400">Thin controllers, distinct services, portable algorithm classes</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
