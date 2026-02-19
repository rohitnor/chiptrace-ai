import React, { useState } from 'react';
import { simulateDisruption } from '../../api';

const DISRUPTION_TYPES = ['fab_capacity', 'logistics', 'quality', 'material', 'financial'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export default function SimulatePanel({ onSimulated }) {
  const [type, setType] = useState('fab_capacity');
  const [severity, setSeverity] = useState('high');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateDisruption(type, severity);
      setResult(res.data);
      onSimulated && onSimulated();
      setTimeout(() => setResult(null), 5000);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6">
      <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4 tracking-tight">Scenario Simulation</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#888888] font-semibold uppercase tracking-widest block mb-2">
            Disruption Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={loading}
            className="w-full text-sm bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2.5 text-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#555555] transition-all hover:border-[#444444] disabled:opacity-50"
          >
            {DISRUPTION_TYPES.map(t => (
              <option key={t} value={t} className="bg-[#0a0a0a]">
                {t.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#888888] font-semibold uppercase tracking-widest block mb-2">
            Severity Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map(s => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                disabled={loading}
                className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  severity === s
                    ? 'bg-[#333333] text-[#e0e0e0] border border-[#555555]'
                    : 'bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a] hover:border-[#333333]'
                } disabled:opacity-50`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full py-3 bg-[#ff6b6b] hover:bg-[#ff5252] disabled:bg-[#ff6b6b]/50 text-[#000000] text-sm font-bold rounded-lg transition-all duration-300 uppercase tracking-wide border border-[#ff6b6b]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">◆</span>
              Injecting Disruption...
            </span>
          ) : (
            'Trigger Scenario'
          )}
        </button>
      </div>

      {result && !result.error && (
        <div className="mt-4 backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] border border-[#ff6b6b] rounded-lg p-4 animate-in fade-in duration-300">
          <p className="text-[#ff6b6b] font-bold text-sm mb-2">Scenario Injected Successfully</p>
          <p className="text-[#ff9999] text-xs">
            <span className="font-semibold">{result.affected_node_count || 0}</span> nodes cascaded to critical state
          </p>
          {result.alert?.leaf_label && (
            <p className="text-[#ff8888] text-xs mt-2">
              Root cause: <span className="font-mono">{result.alert.leaf_label}</span>
            </p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="mt-4 backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] border border-[#666666] rounded-lg p-4">
          <p className="text-[#e0e0e0] font-semibold text-sm">Simulation Error</p>
          <p className="text-[#888888] text-xs mt-1">{result.error}</p>
        </div>
      )}
    </div>
  );
}
