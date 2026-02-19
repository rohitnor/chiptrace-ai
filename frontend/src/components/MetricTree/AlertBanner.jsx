import React, { useState } from 'react';

export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter(a => !dismissed.includes(a.node_id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.slice(0, 3).map((alert, i) => (
        <div
          key={i}
          className="rounded-xl px-5 py-3.5 flex items-start justify-between alert-pulse"
          style={{
            background: 'rgba(139,32,32,0.14)',
            border: '1px solid rgba(139,32,32,0.40)',
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                style={{ background: 'rgba(139,32,32,0.30)', color: '#D97070' }}
              >
                Critical
              </span>
              <span className="text-[#C09090] text-sm font-medium">{alert.label}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.30)', color: '#A07070' }}
              >
                Score: {alert.score?.toFixed(0)} / 100
              </span>
            </div>
            {alert.trace?.length > 0 && (
              <p className="text-[#806060] text-xs mt-1.5 leading-relaxed">
                Root cause path: {alert.trace.join(' → ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(d => [...d, alert.node_id])}
            className="text-[#806060] hover:text-[#D97070] text-base leading-none ml-4 mt-0.5 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
      {visible.length > 3 && (
        <p className="text-[#806060] text-xs text-center">
          +{visible.length - 3} more alerts
        </p>
      )}
    </div>
  );
}
