import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';

import Dashboard       from './pages/Dashboard';
import CompareView     from './pages/CompareView';
import DisruptionDetail from './pages/DisruptionDetail';
import SupplierNetwork from './pages/SupplierNetwork';

/* ── Tiny status-light component ─────────────── */
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
    </span>
  );
}

/* ── Navigation bar ───────────────────────────── */
function Nav() {
  const linkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase transition-all duration-200 ${
      isActive
        ? 'glass text-white shadow-sm'
        : 'text-[#606060] hover:text-[#c0c0c0] hover:bg-white/[0.04]'
    }`;

  return (
    <nav className="glass-nav sticky top-0 z-50 accelerate">
      <div className="max-w-screen-2xl mx-auto px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1" fill="rgba(255,255,255,0.7)" />
                <rect x="10" y="2" width="6" height="6" rx="1" fill="rgba(255,255,255,0.35)" />
                <rect x="2" y="10" width="6" height="6" rx="1" fill="rgba(255,255,255,0.35)" />
                <rect x="10" y="10" width="6" height="6" rx="1" fill="rgba(255,255,255,0.7)" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-[#f0f0f0] text-sm font-bold tracking-tight leading-none">
              ChipTrace <span className="text-[#707070] font-normal">AI</span>
            </h1>
            <p className="text-[#484848] text-[10px] tracking-widest uppercase mt-0.5 leading-none">
              Supply Chain Intelligence
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          <NavLink to="/"            end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/compare"         className={linkClass}>Compare</NavLink>
          <NavLink to="/disruptions"     className={linkClass}>Disruptions</NavLink>
          <NavLink to="/suppliers"       className={linkClass}>Suppliers</NavLink>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2.5 glass-card rounded-full px-3.5 py-1.5">
          <LiveDot />
          <span className="text-[#585858] text-[10px] font-semibold tracking-widest uppercase">Live</span>
        </div>

      </div>
    </nav>
  );
}

/* ── App shell ────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-screen-2xl mx-auto px-8 py-8">
          <Routes>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/compare"        element={<CompareView />} />
            <Route path="/disruptions"    element={<DisruptionDetail />} />
            <Route path="/disruptions/:id" element={<DisruptionDetail />} />
            <Route path="/suppliers"      element={<SupplierNetwork />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
