import React, { useEffect, useState } from 'react';
import { fetchSuppliers } from '../api';

const TIER_LABELS = { 0: 'OEM', 1: 'Tier-1 Chip Supplier', 2: 'Tier-2 Fab/OSAT/Wafer', 3: 'Tier-3 Materials' };
const TIER_COLORS = { 0: 'bg-blue-900 text-white', 1: 'bg-blue-700 text-white', 2: 'bg-blue-500 text-white', 3: 'bg-blue-200 text-blue-900' };

export default function SupplierNetwork() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers().then(r => setSuppliers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = selectedTier !== null ? suppliers.filter(s => s.tier === selectedTier) : suppliers;
  const byTier = [0, 1, 2, 3].map(t => suppliers.filter(s => s.tier === t));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Network</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedTier === null ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          {[0, 1, 2, 3].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedTier === t ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(t => (
          <div key={t} className={`rounded-xl p-4 ${TIER_COLORS[t]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{TIER_LABELS[t]}</p>
            <p className="text-3xl font-bold mt-1">{byTier[t].length}</p>
            <p className="text-xs opacity-70 mt-1">
              {byTier[t].filter(s => s.is_single_source).length} single-source risk
            </p>
          </div>
        ))}
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Supplier', 'Tier', 'Country', 'Region', 'Node', 'Financial Health', 'Geo Risk', 'Single Source'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(s => (
              <tr key={s.supplier_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TIER_COLORS[s.tier]}`}>
                    T{s.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.country}</td>
                <td className="px-4 py-3 text-gray-500">{s.region}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.node_specialization || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.financial_health_score > 70 ? 'bg-green-500' : s.financial_health_score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${s.financial_health_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{s.financial_health_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.geopolitical_risk_score < 30 ? 'bg-green-500' : s.geopolitical_risk_score < 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${s.geopolitical_risk_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{s.geopolitical_risk_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {s.is_single_source ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⚠ Single Source</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Multi Source</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
