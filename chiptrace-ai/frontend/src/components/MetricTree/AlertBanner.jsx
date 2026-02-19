import React, { useState } from 'react';

export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);

  const visible = alerts.filter(a => !dismissed.includes(a.node_id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.slice(0, 3).map((alert, i) => (
        <div key={i} className="bg-red-50 border border-red-300 rounded-xl px-5 py-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold text-sm alert-pulse">🔴 CRITICAL ALERT</span>
              <span className="text-red-700 text-sm font-medium">{alert.label}</span>
              <span className="text-red-400 text-xs bg-red-100 px-2 py-0.5 rounded-full">
                Score: {alert.score?.toFixed(0)}/100
              </span>
            </div>
            {alert.trace?.length > 0 && (
              <p className="text-red-600 text-xs mt-1">
                Root cause path: {alert.trace.join(' → ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(d => [...d, alert.node_id])}
            className="text-red-400 hover:text-red-600 text-lg leading-none ml-4"
          >
            ×
          </button>
        </div>
      ))}
      {visible.length > 3 && (
        <p className="text-red-500 text-xs text-center">+{visible.length - 3} more alerts</p>
      )}
    </div>
  );
}
