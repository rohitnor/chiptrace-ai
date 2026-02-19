import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import CompareView from './pages/CompareView';
import DisruptionDetail from './pages/DisruptionDetail';
import SupplierNetwork from './pages/SupplierNetwork';

function Nav() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-[#333333] text-[#e0e0e0] border border-[#555555]'
        : 'text-[#888888] hover:text-[#e0e0e0] hover:bg-[#1a1a1a] border border-transparent hover:border-[#333333]'
    }`;

  return (
    <nav className="backdrop-blur-md bg-gradient-to-r from-[#000000] to-[#0a0a0a] border-b border-[#333333] shadow-2xl sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[#f5f5f5] text-xl font-black tracking-tight">ChipTrace AI</h1>
            <p className="text-[#888888] text-xs mt-0.5">
              Supply Chain Intelligence Platform
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/compare" className={linkClass}>Compare</NavLink>
          <NavLink to="/disruptions" className={linkClass}>Disruptions</NavLink>
          <NavLink to="/suppliers" className={linkClass}>Suppliers</NavLink>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#000000]">
        <Nav />
        <main className="max-w-8xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<CompareView />} />
            <Route path="/disruptions" element={<DisruptionDetail />} />
            <Route path="/disruptions/:id" element={<DisruptionDetail />} />
            <Route path="/suppliers" element={<SupplierNetwork />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
