import React, { useEffect, useState } from 'react';
import { fetchSuppliers } from '../api';

const TIER_LABELS = { 0: 'OEM', 1: 'Tier-1 Chip Supplier', 2: 'Tier-2 Fab/OSAT/Wafer', 3: 'Tier-3 Materials' };
const TIER_COLORS = { 0: 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]', 1: 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]', 2: 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]', 3: 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]' };

export default function SupplierNetwork() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers().then(r => setSuppliers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = selectedTier !== null ? suppliers.filter(s => s.tier === selectedTier) : suppliers;
  const byTier = [0, 1, 2, 3].map(t => suppliers.filter(s => s.tier === t));

  if (loading) return <div className="p-8 text-center text-[#888888]">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Supplier Network</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedTier === null ? 'bg-[#333333] text-[#e0e0e0]' : 'bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a]'}`}
          >
            All
          </button>
          {[0, 1, 2, 3].map(t => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedTier === t ? 'bg-[#333333] text-[#e0e0e0]' : 'bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a]'}`}
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(t => (
          <div key={t} className={`rounded-lg p-4 ${TIER_COLORS[t]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80 text-[#888888]">{TIER_LABELS[t]}</p>
            <p className="text-3xl font-bold mt-1 text-[#e0e0e0]">{byTier[t].length}</p>
            <p className="text-xs opacity-70 mt-1 text-[#666666]">
              {byTier[t].filter(s => s.is_single_source).length} single-source risk
            </p>
          </div>
        ))}
      </div>

      {/* Supplier Table */}
      <div className="bg-[#0a0a0a] rounded-lg border border-[#333333] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1a1a] border-b border-[#333333]">
            <tr>
              {['Supplier', 'Tier', 'Country', 'Region', 'Node', 'Financial Health', 'Geo Risk', 'Single Source'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {filtered.map(s => (
              <tr key={s.supplier_id} className="hover:bg-[#1a1a1a]">
                <td className="px-4 py-3 font-medium text-[#e0e0e0]">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-[#88dd88] border border-[#333333]`}>
                    T{s.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#d0d0d0]">{s.country}</td>
                <td className="px-4 py-3 text-[#888888]">{s.region}</td>
                <td className="px-4 py-3 text-[#888888] font-mono text-xs">{s.node_specialization || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-[#2a2a2a] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.financial_health_score > 70 ? 'bg-[#88dd88]' : s.financial_health_score > 50 ? 'bg-[#e0e0e0]' : 'bg-[#ff6b6b]'}`}
                        style={{ width: `${s.financial_health_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#888888]">{s.financial_health_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-[#2a2a2a] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.geopolitical_risk_score < 30 ? 'bg-[#88dd88]' : s.geopolitical_risk_score < 60 ? 'bg-[#e0e0e0]' : 'bg-[#ff6b6b]'}`}
                        style={{ width: `${s.geopolitical_risk_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#888888]">{s.geopolitical_risk_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {s.is_single_source ? (
                    <span className="px-2 py-1 bg-[#1a1a1a] text-[#ff6b6b] rounded-full text-xs font-medium border border-[#ff6b6b]">Single Source</span>
                  ) : (
                    <span className="px-2 py-1 bg-[#1a1a1a] text-[#88dd88] rounded-full text-xs font-medium border border-[#333333]">Multi Source</span>
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
