import React from 'react';

function PredCard({ title, value, unit, sub, accentColor }) {
  const isLoading = value === undefined || value === null;
  
  return (
    <div className={`backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border ${accentColor.border} rounded-lg p-4 transition-all`}>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">{title}</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 bg-slate-800/40 rounded animate-pulse w-2/3"></div>
          <div className="h-3 bg-slate-800/30 rounded animate-pulse w-1/2"></div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-black ${accentColor.text}`}>
              {value.toFixed(1)}
            </p>
            <span className="text-slate-400 text-xs font-medium">{unit}</span>
          </div>
          {sub && (
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">{sub}</p>
          )}
        </>
      )}
    </div>
  );
}

export default function PredictionCards({ predictions, selectedNode, loading }) {
  const summary = predictions?.summary || {};
  
  console.log('PredictionCards - Received predictions:', predictions);
  console.log('PredictionCards - Summary data:', summary);
  
  const accentColors = {
    delay: {
      border: 'border-[#333333] hover:border-[#555555]',
      text: 'text-[#e0e0e0]'
    },
    resolution: {
      border: 'border-[#333333] hover:border-[#555555]',
      text: 'text-[#e0e0e0]'
    },
    impact: {
      border: 'border-[#333333] hover:border-[#555555]',
      text: 'text-[#e0e0e0]'
    }
  };

  return (
    <div className="space-y-3">
      <PredCard
        title="Predicted Delay"
        value={summary?.predicted_delay_days}
        unit="days"
        sub={`Disruption: ${summary?.disruption_type ? summary.disruption_type.replace(/_/g, ' ') : 'N/A'}`}
        accentColor={accentColors.delay}
      />
      
      <PredCard
        title="Resolution Time"
        value={summary?.predicted_resolution_days}
        unit="days"
        sub={`Severity: ${summary?.severity ? summary.severity.toUpperCase() : 'N/A'}`}
        accentColor={accentColors.resolution}
      />
      
      <PredCard
        title="OEM Impact"
        value={summary?.oem_impact_days}
        unit="days lost"
        sub="Downstream assembly line impact"
        accentColor={accentColors.impact}
      />

      {selectedNode && (
        <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-4 mt-4">
          <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">Selected Node</p>
          <p className="text-[#d0d0d0] text-sm font-medium mt-2">{selectedNode.label}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div>
              <p className="text-[#666666] text-xs mb-1">Score</p>
              <p className="text-[#e0e0e0] font-bold">{selectedNode.score?.toFixed(0)} / 100</p>
            </div>
            <div>
              <p className="text-[#666666] text-xs mb-1">Status</p>
              <p className="text-[#b0b0b0] font-semibold capitalize">{selectedNode.status}</p>
            </div>
          </div>
          <p className="text-[#555555] font-mono text-xs mt-3 break-all">{selectedNode.node_id}</p>
        </div>
      )}
    </div>
  );
}
