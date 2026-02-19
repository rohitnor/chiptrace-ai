import React from 'react';

function PredCard({ title, value, unit, sub, color, icon }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      </div>
      <p className="text-3xl font-bold">
        {value !== undefined && value !== null ? value : '—'}
        {value !== undefined && value !== null && <span className="text-base font-normal ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

export default function PredictionCards({ predictions, selectedNode }) {
  const summary = predictions?.summary;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        🤖 ML Predictions
        {predictions?.delay?.fallback && (
          <span className="ml-2 text-xs text-gray-400">(rule-based fallback — train models first)</span>
        )}
      </h3>

      <PredCard
        title="Predicted Delay"
        value={summary?.predicted_delay_days}
        unit="days"
        sub={`Disruption type: ${summary?.disruption_type || '—'}`}
        color="bg-orange-50 border-orange-200 text-orange-900"
        icon="⏱"
      />
      <PredCard
        title="Resolution Timeline"
        value={summary?.predicted_resolution_days}
        unit="days"
        sub={`Severity: ${summary?.severity || '—'}`}
        color="bg-amber-50 border-amber-200 text-amber-900"
        icon="🔧"
      />
      <PredCard
        title="OEM Production Impact"
        value={summary?.oem_impact_days}
        unit="days lost"
        sub="Downstream assembly line impact"
        color="bg-red-50 border-red-200 text-red-900"
        icon="🏭"
      />

      {selectedNode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-700">Selected Node</p>
          <p className="text-sm text-blue-900 mt-1">{selectedNode.label}</p>
          <p className="text-xs text-blue-600 mt-1">
            Score: {selectedNode.score?.toFixed(1)} · Status: {selectedNode.status}
          </p>
          <p className="text-xs font-mono text-blue-400 mt-1 break-all">{selectedNode.node_id}</p>
        </div>
      )}
    </div>
  );
}
