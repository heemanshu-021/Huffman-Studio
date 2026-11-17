import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">404 &mdash; Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested page does not exist in Huffman Studio.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
};
