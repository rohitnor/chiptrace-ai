import React, { useState } from 'react';

export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter(a => !dismissed.includes(a.node_id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.slice(0, 3).map((alert, i) => (
        <div key={i} className="bg-[#1a1a1a] border border-[#ff6b6b] rounded-lg px-5 py-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#ff6b6b] font-bold text-sm alert-pulse">CRITICAL</span>
              <span className="text-[#ff9999] text-sm font-medium">{alert.label}</span>
              <span className="text-[#ff8888] text-xs bg-[#0a0a0a] px-2 py-0.5 rounded-full border border-[#ff6b6b]">
                Score: {alert.score?.toFixed(0)}/100
              </span>
            </div>
            {alert.trace?.length > 0 && (
              <p className="text-[#ff8888] text-xs mt-1">
                Root cause path: {alert.trace.join(' → ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(d => [...d, alert.node_id])}
            className="text-[#ff8888] hover:text-[#ff6b6b] text-lg leading-none ml-4"
          >
            ×
          </button>
        </div>
      ))}
      {visible.length > 3 && (
        <p className="text-[#ff8888] text-xs text-center">+{visible.length - 3} more alerts</p>
      )}
    </div>
  );
}
