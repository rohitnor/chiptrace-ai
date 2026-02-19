import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';

// Pages (teammates will build these out)
import Dashboard from './pages/Dashboard';
import CompareView from './pages/CompareView';
import DisruptionDetail from './pages/DisruptionDetail';
import SupplierNetwork from './pages/SupplierNetwork';

function Nav() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white text-xl font-bold tracking-tight">
            🔍 ChipTrace AI
          </span>
          <span className="text-blue-300 text-xs">
            Automotive Semiconductor Supply Chain
          </span>
        </div>
        <div className="flex gap-2">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/compare" className={linkClass}>Flat vs Tree</NavLink>
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
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 py-6">
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
