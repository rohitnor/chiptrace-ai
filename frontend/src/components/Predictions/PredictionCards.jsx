import React from 'react';

/* ── Single prediction metric card ─────────── */
function PredCard({ title, value, unit, sub, accentColor }) {
  const isLoading = value === undefined || value === null;

  return (
    <div className="glass-card rounded-xl p-4 transition-all">
      <p className="label-xs mb-3">{title}</p>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 shimmer rounded-lg w-2/3" />
          <div className="h-2.5 shimmer rounded w-1/2" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <p className="text-3xl font-black leading-none" style={{ color: accentColor }}>
              {value.toFixed(1)}
            </p>
            <span className="text-[#505050] text-xs font-medium">{unit}</span>
          </div>
          {sub && (
            <p className="text-[#484848] text-xs mt-2 leading-relaxed">{sub}</p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Selected node inspector ─────────────────── */
function NodeInspector({ node }) {
  if (!node) return null;

  const statusColor = { red: '#D97070', amber: '#C9A84C', green: '#5BAD82' }[node.status] || '#A0A0A0';

  return (
    <div
      className="glass-card rounded-xl p-4 border-t mt-4 fade-up"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    >
      <p className="label-xs mb-3">Selected Node</p>
      <p className="text-[#D0D0D0] text-sm font-semibold leading-tight">{node.label}</p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <p className="text-[#484848] text-[10px] uppercase tracking-wider mb-1">Score</p>
          <p className="font-bold text-sm" style={{ color: statusColor }}>
            {node.score?.toFixed(0)} / 100
          </p>
        </div>
        <div>
          <p className="text-[#484848] text-[10px] uppercase tracking-wider mb-1">Status</p>
          <p className="font-semibold text-sm capitalize" style={{ color: statusColor }}>
            {node.status}
          </p>
        </div>
      </div>

      <p className="text-[#383838] font-mono text-[10px] mt-3 break-all leading-relaxed">
        {node.node_id}
      </p>
    </div>
  );
}

/* ── Prediction Cards ────────────────────────── */
export default function PredictionCards({ predictions, selectedNode, loading }) {
  const summary = predictions?.summary || {};

  const CARDS = [
    {
      title: 'Predicted Delay',
      value: summary?.predicted_delay_days,
      unit: 'days',
      sub: `Disruption: ${summary?.disruption_type
        ? summary.disruption_type.replace(/_/g, ' ')
        : 'N/A'}`,
      accentColor: '#C9A84C',
    },
    {
      title: 'Resolution Time',
      value: summary?.predicted_resolution_days,
      unit: 'days',
      sub: `Severity: ${summary?.severity
        ? summary.severity.toUpperCase()
        : 'N/A'}`,
      accentColor: '#D09060',
    },
    {
      title: 'OEM Impact',
      value: summary?.oem_impact_days,
      unit: 'days lost',
      sub: 'Downstream assembly line impact',
      accentColor: '#D97070',
    },
  ];

  return (
    <div className="space-y-3">
      {CARDS.map((card, i) => (
        <PredCard key={i} {...card} />
      ))}
      <NodeInspector node={selectedNode} />
    </div>
  );
}
