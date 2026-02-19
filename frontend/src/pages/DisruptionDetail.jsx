import React, { useEffect, useState } from 'react';
import { fetchDisruptions } from '../api';

/* ── Severity helpers ───────────────────────── */
function severityBadgeClass(s) {
  const map = {
    critical: 'badge-critical',
    high: 'badge-critical',
    medium: 'badge-warn',
    low: 'badge-ok',
  };
  return map[s] || 'badge-info';
}

function severityBarColor(s) {
  const map = {
    critical: '#8B2020',
    high: '#8B2020',
    medium: '#7A5C1E',
    low: '#1E5C3A',
  };
  return map[s] || '#444';
}

/* ── Loading skeleton ───────────────────────── */
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

/* ── Disruption Detail ──────────────────────── */
export default function DisruptionDetail() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisruptions(30)
      .then(r => setDisruptions(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const COLUMNS = [
    'Triggered Node', 'Type', 'Severity',
    'OEM Impact', 'Pred. Res.', 'Actual Res.',
    'Triggered At', 'Status',
  ];

  return (
    <div className="space-y-8 fade-in">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8E8E8] tracking-tight">Disruption Log</h1>
        <p className="text-[#484848] text-xs tracking-widest uppercase mt-3">
          Historical and active supply chain disruption events
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Events',
            value: disruptions.length,
            accent: '#A0A0A0',
          },
          {
            label: 'Active',
            value: disruptions.filter(d => !d.resolved_at).length,
            accent: '#D97070',
          },
          {
            label: 'Resolved',
            value: disruptions.filter(d => d.resolved_at).length,
            accent: '#5BAD82',
          },
        ].map(({ label, value, accent }, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="label-xs">{label}</p>
            <p className="text-4xl font-black mt-2" style={{ color: accent }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-dark rounded-2xl overflow-hidden fade-up" style={{ animationDelay: '200ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {COLUMNS.map(h => (
                <th key={h} className="px-4 py-4 text-left label-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disruptions.map((d) => (
              <tr
                key={d.disruption_id}
                className="border-t transition-colors hover:bg-white/[0.025]"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <td className="px-4 py-3.5 font-mono text-xs text-[#484848] max-w-[180px] truncate">
                  {d.triggered_node_id}
                </td>
                <td className="px-4 py-3.5 text-[#C0C0C0] capitalize text-xs">
                  {d.disruption_type?.replace('_', ' ')}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${severityBadgeClass(d.severity)}`}>
                    {d.severity}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[#909090] text-xs">
                  {d.oem_impact_days ?? '—'}d
                </td>
                <td className="px-4 py-3.5 text-[#909090] text-xs">
                  {d.predicted_resolution_days ?? '—'}d
                </td>
                <td className="px-4 py-3.5 text-[#909090] text-xs">
                  {d.actual_resolution_days ?? '—'}d
                </td>
                <td className="px-4 py-3.5 text-[#484848] text-xs">
                  {d.triggered_at ? new Date(d.triggered_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: '2-digit'
                  }) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  {d.resolved_at ? (
                    <span className="badge-ok px-2.5 py-1 rounded-full text-[10px] font-semibold">Resolved</span>
                  ) : (
                    <span className="badge-critical px-2.5 py-1 rounded-full text-[10px] font-semibold">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {disruptions.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
              <span className="text-[#5BAD82] font-bold text-lg">OK</span>
            </div>
            <p className="text-[#484848] text-sm">No disruption events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
