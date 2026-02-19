import React, { useEffect, useState } from 'react';
import { fetchComparison } from '../api';

/* ── Status helpers ─────────────────────────── */
function scoreColor(status) {
  const map = { red: '#D97070', amber: '#C9A84C', green: '#5BAD82' };
  return map[status] || '#A0A0A0';
}

function scoreBorderColor(status) {
  const map = {
    red: 'rgba(139,32,32,0.55)',
    amber: 'rgba(122,92,30,0.55)',
    green: 'rgba(30,92,58,0.55)',
  };
  return map[status] || 'rgba(80,80,80,0.4)';
}

function statusBadge(status) {
  if (status === 'red') return 'badge-critical';
  if (status === 'amber') return 'badge-warn';
  if (status === 'green') return 'badge-ok';
  return '';
}

/* ── Section divider label ───────────────────── */
function SectionLabel({ text }) {
  return (
    <p className="label-xs mb-3">{text}</p>
  );
}

/* ── Loading skeleton ────────────────────────── */
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

/* ── Compare View ────────────────────────────── */
export default function CompareView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-8 fade-in">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8E8E8] tracking-tight">
          Flat vs Hierarchical Reporting
        </h1>
        <p className="text-[#484848] text-xs tracking-widest uppercase mt-3">
          Same supply chain data — two completely different levels of insight
        </p>
      </div>

      {/* Key difference callout */}
      {data?.key_difference && (
        <div className="glass rounded-2xl p-5 fade-up">
          <p className="text-[#B0B0B0] text-sm leading-relaxed">{data.key_difference}</p>
        </div>
      )}

      {/* Side-by-side panels */}
      <div className="grid grid-cols-2 gap-6">

        {/* ── FLAT panel ── */}
        <div className="glass-dark rounded-2xl overflow-hidden fade-up" style={{ animationDelay: '80ms' }}>
          {/* Panel header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(139,32,32,0.30)', background: 'rgba(139,32,32,0.08)' }}
          >
            <div>
              <h2 className="text-[#D97070] font-semibold text-sm">Flat Report</h2>
              <p className="text-[#484848] text-xs mt-0.5">Traditional</p>
            </div>
            <span className="badge-critical text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
              Legacy
            </span>
          </div>

          <div className="p-5">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {data?.flat?.columns?.map(col => (
                      <th key={col} className="px-3 py-2 text-left label-xs">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.flat?.rows?.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t transition-colors hover:bg-white/[0.03]"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <td className="px-3 py-2.5 font-mono text-[#444]">{row.event_id}</td>
                      <td className="px-3 py-2.5 text-[#C0C0C0]">{row.chip}</td>
                      <td className="px-3 py-2.5 text-[#707070]">{row.application}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.status === 'critical' ? 'badge-critical' :
                            row.status === 'delayed' ? 'badge-warn' : 'badge-ok'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold text-xs ${row.delay_days > 0 ? 'text-[#D97070]' : 'text-[#5BAD82]'
                        }`}>
                        {row.delay_days > 0 ? `+${row.delay_days}` : row.delay_days}
                      </td>
                      <td className="px-3 py-2.5 text-[#606060]">{row.defect_ppm?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insight */}
            {data?.flat?.insight && (
              <div className="mt-4 rounded-xl p-4 border" style={{ background: 'rgba(139,32,32,0.07)', borderColor: 'rgba(139,32,32,0.25)' }}>
                <p className="text-[#D97070] text-xs leading-relaxed">{data.flat.insight}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── HIERARCHICAL panel ── */}
        <div className="glass-dark rounded-2xl overflow-hidden fade-up" style={{ animationDelay: '140ms' }}>
          {/* Panel header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(30,92,58,0.30)', background: 'rgba(30,92,58,0.08)' }}
          >
            <div>
              <h2 className="text-[#5BAD82] font-semibold text-sm">Metric Tree</h2>
              <p className="text-[#484848] text-xs mt-0.5">ChipTrace AI</p>
            </div>
            <span className="badge-ok text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
              Intelligent
            </span>
          </div>

          <div className="p-5 space-y-5">

            {/* Root score */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-2 glass-card"
                style={{
                  color: scoreColor(data?.hierarchical?.root_status),
                  borderColor: scoreBorderColor(data?.hierarchical?.root_status),
                }}
              >
                {data?.hierarchical?.root_health_score}
              </div>
              <div>
                <p className="text-[#D0D0D0] font-semibold text-sm">Supply Chain Health Score</p>
                <p className="label-xs mt-1">
                  {data?.hierarchical?.red_node_count} CRITICAL &middot; {data?.hierarchical?.amber_node_count} WARNING
                </p>
              </div>
            </div>

            {/* Root cause trace */}
            <div>
              <SectionLabel text="Root Cause Trace" />
              <div className="space-y-1.5">
                {data?.hierarchical?.root_cause_trace?.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#383838] text-xs">{Array(i + 1).join('  ')}{'→'}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusBadge(node.status)}`}
                    >
                      {node.label}
                      <span className="ml-1.5 opacity-50 font-normal">({node.score?.toFixed(0)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical nodes */}
            {data?.hierarchical?.critical_nodes?.length > 0 && (
              <div>
                <SectionLabel text="Critical Nodes" />
                <div className="space-y-1.5">
                  {data.hierarchical.critical_nodes.map((n, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5"
                    >
                      <span className="text-xs text-[#C09090]">{n.label}</span>
                      <span className="text-xs font-bold text-[#D97070]">{n.score?.toFixed(0)}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insight */}
            {data?.hierarchical?.insight && (
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(30,92,58,0.07)', borderColor: 'rgba(30,92,58,0.25)' }}>
                <p className="text-[#5BAD82] text-xs leading-relaxed">{data.hierarchical.insight}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
