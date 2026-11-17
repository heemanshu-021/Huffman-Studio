import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useHealthCheck } from '../hooks/useHealthCheck';

export const MainLayout: React.FC = () => {
  const { status, data } = useHealthCheck(10000);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-slate-900">
      <Navbar healthStatus={status} version={data?.version} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
