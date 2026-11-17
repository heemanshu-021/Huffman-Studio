import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CompressorPage } from './pages/CompressorPage';
import { DecompressorPage } from './pages/DecompressorPage';
import { VisualizerPage } from './pages/VisualizerPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="compress" element={<CompressorPage />} />
          <Route path="decompress" element={<DecompressorPage />} />
          <Route path="visualizer" element={<VisualizerPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
