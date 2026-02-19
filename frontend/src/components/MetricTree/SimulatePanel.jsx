import React, { useState } from 'react';
import { simulateDisruption } from '../../api';

const DISRUPTION_TYPES = ['fab_capacity', 'logistics', 'quality', 'material', 'financial'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const SEV_STYLE = {
  low: { color: '#5BAD82', border: 'rgba(30,92,58,0.50)' },
  medium: { color: '#C9A84C', border: 'rgba(122,92,30,0.50)' },
  high: { color: '#D97070', border: 'rgba(139,32,32,0.50)' },
  critical: { color: '#D97070', border: 'rgba(139,32,32,0.70)' },
};

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
      setTimeout(() => setResult(null), 6000);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-dark rounded-2xl p-5">
      <h2 className="text-[#C0C0C0] text-sm font-semibold tracking-tight mb-5">
        Scenario Simulation
      </h2>

      <div className="space-y-5">

        {/* Disruption type */}
        <div>
          <label className="label-xs block mb-2">Disruption Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={loading}
            className="w-full text-xs glass-card rounded-xl px-4 py-3 text-[#C0C0C0]
                       focus:border-white/20 cursor-pointer disabled:opacity-50"
            style={{ appearance: 'none' }}
          >
            {DISRUPTION_TYPES.map(t => (
              <option key={t} value={t} style={{ background: '#0d0d0d', color: '#C0C0C0' }}>
                {t.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Severity selector */}
        <div>
          <label className="label-xs block mb-2">Severity Level</label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map(s => {
              const sty = SEV_STYLE[s];
              const active = severity === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  disabled={loading}
                  className="py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  style={{
                    background: active ? `${sty.border}` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? sty.border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? sty.color : '#585858',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger button */}
        <button
          onClick={run}
          disabled={loading}
          className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                     disabled:opacity-50"
          style={{
            background: 'rgba(139,32,32,0.20)',
            border: '1px solid rgba(139,32,32,0.45)',
            color: '#D97070',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(139,32,32,0.30)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,32,32,0.20)'; }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-current animate-spin"
                style={{ borderTopColor: 'transparent' }}
              />
              Injecting Disruption...
            </span>
          ) : (
            'Trigger Scenario'
          )}
        </button>

      </div>

      {/* Result */}
      {result && !result.error && (
        <div
          className="mt-4 rounded-xl p-4 scale-in"
          style={{ background: 'rgba(139,32,32,0.12)', border: '1px solid rgba(139,32,32,0.35)' }}
        >
          <p className="text-[#D97070] font-bold text-xs mb-1.5">Scenario Injected</p>
          <p className="text-[#A07070] text-xs">
            <span className="font-semibold text-[#D97070]">{result.affected_node_count || 0}</span>
            {' '}nodes cascaded to critical state
          </p>
          {result.alert?.leaf_label && (
            <p className="text-[#806060] text-xs mt-1.5">
              Root cause: <span className="font-mono text-[#C09090]">{result.alert.leaf_label}</span>
            </p>
          )}
        </div>
      )}

      {result?.error && (
        <div
          className="mt-4 rounded-xl p-4 scale-in"
          style={{ background: 'rgba(80,80,80,0.12)', border: '1px solid rgba(80,80,80,0.30)' }}
        >
          <p className="text-[#A0A0A0] font-semibold text-xs">Simulation Error</p>
          <p className="text-[#606060] text-xs mt-1">{result.error}</p>
        </div>
      )}
    </div>
  );
}
