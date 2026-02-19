import React, { useEffect, useState } from 'react';
import { fetchSuppliers } from '../api';

const TIER_LABELS = {
  0: 'OEM',
  1: 'Tier-1 Chip',
  2: 'Tier-2 Fab / OSAT',
  3: 'Tier-3 Materials',
};

function tierBadge(tier) {
  const colors = [
    { bg: 'rgba(30,58,92,0.20)', border: 'rgba(30,58,92,0.50)', color: '#6AABCF' },  // T0
    { bg: 'rgba(30,92,58,0.18)', border: 'rgba(30,92,58,0.45)', color: '#5BAD82' },  // T1
    { bg: 'rgba(122,92,30,0.18)', border: 'rgba(122,92,30,0.45)', color: '#C9A84C' },  // T2
    { bg: 'rgba(80,50,100,0.18)', border: 'rgba(80,50,100,0.45)', color: '#AB85D0' },  // T3
  ];
  const c = colors[tier] || colors[0];
  return c;
}

function healthColor(score) {
  if (score > 70) return '#5BAD82';
  if (score > 50) return '#C9A84C';
  return '#D97070';
}

function riskColor(score) {
  if (score < 30) return '#5BAD82';
  if (score < 60) return '#C9A84C';
  return '#D97070';
}

function MiniBar({ value, colorFn }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  const color = colorFn(value);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs" style={{ color: '#686868' }}>{pct.toFixed(0)}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="w-10 h-10 rounded-full border border-white/10 animate-spin"
        style={{ borderTopColor: 'rgba(255,255,255,0.50)' }}
      />
    </div>
  );
}

export default function SupplierNetwork() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers()
      .then(r => setSuppliers(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const filtered = selectedTier !== null
    ? suppliers.filter(s => s.tier === selectedTier)
    : suppliers;

  const byTier = [0, 1, 2, 3].map(t => suppliers.filter(s => s.tier === t));

  const COLUMNS = [
    'Supplier', 'Tier', 'Country', 'Region',
    'Node Spec.', 'Fin. Health', 'Geo Risk', 'Source',
  ];

  return (
    <div className="space-y-8 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#E8E8E8] tracking-tight">Supplier Network</h1>
          <p className="text-[#484848] text-xs tracking-widest uppercase mt-3">
            Full N-tier supplier map — geopolitical and financial risk overview
          </p>
        </div>

        {/* Tier filter pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${selectedTier === null
                ? 'glass text-[#D0D0D0]'
                : 'text-[#585858] hover:text-[#A0A0A0] hover:bg-white/[0.04]'
              }`}
          >
            All
          </button>
          {[0, 1, 2, 3].map(t => {
            const c = tierBadge(t);
            return (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${selectedTier === t
                    ? 'glass'
                    : 'text-[#585858] hover:text-[#A0A0A0] hover:bg-white/[0.04]'
                  }`}
                style={selectedTier === t ? { color: c.color } : {}}
              >
                {TIER_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((t, i) => {
          const c = tierBadge(t);
          const tierList = byTier[t];
          const ssCount = tierList.filter(s => s.is_single_source).length;
          return (
            <div
              key={t}
              className="glass-card rounded-2xl p-5 cursor-pointer fade-up"
              style={{
                animationDelay: `${i * 60}ms`,
                borderColor: selectedTier === t ? c.border : undefined,
              }}
              onClick={() => setSelectedTier(selectedTier === t ? null : t)}
            >
              <p className="label-xs">{TIER_LABELS[t]}</p>
              <p className="text-4xl font-black mt-2" style={{ color: c.color }}>{tierList.length}</p>
              <p className="text-xs mt-2" style={{ color: '#484848' }}>
                {ssCount > 0 ? `${ssCount} single-source risk` : 'No single-source risk'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Supplier table */}
      <div className="glass-dark rounded-2xl overflow-hidden fade-up" style={{ animationDelay: '280ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {COLUMNS.map(h => (
                <th key={h} className="px-4 py-4 text-left label-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const c = tierBadge(s.tier);
              return (
                <tr
                  key={s.supplier_id}
                  className="border-t transition-colors hover:bg-white/[0.025]"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                >
                  <td className="px-4 py-3.5 font-medium text-[#D0D0D0]">{s.name}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                    >
                      T{s.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#C0C0C0] text-xs">{s.country}</td>
                  <td className="px-4 py-3.5 text-[#707070] text-xs">{s.region}</td>
                  <td className="px-4 py-3.5 font-mono text-[#606060] text-[11px]">
                    {s.node_specialization || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <MiniBar value={s.financial_health_score} colorFn={healthColor} />
                  </td>
                  <td className="px-4 py-3.5">
                    <MiniBar value={s.geopolitical_risk_score} colorFn={riskColor} />
                  </td>
                  <td className="px-4 py-3.5">
                    {s.is_single_source ? (
                      <span className="badge-critical px-2.5 py-1 rounded-full text-[10px] font-semibold">
                        Single
                      </span>
                    ) : (
                      <span className="badge-ok px-2.5 py-1 rounded-full text-[10px] font-semibold">
                        Multi
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3">
            <p className="text-[#484848] text-sm">No suppliers found for this tier</p>
          </div>
        )}
      </div>
    </div>
  );
}
