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
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🧪 Simulate Disruption</h3>
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Disruption Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DISRUPTION_TYPES.map(t => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Severity</label>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SEVERITIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
        >
          {loading ? 'Injecting...' : '⚡ Trigger Disruption'}
        </button>
      </div>
      {result && !result.error && (
        <div className="mt-3 bg-red-50 rounded-lg p-3 text-xs">
          <p className="text-red-700 font-medium">Disruption injected!</p>
          <p className="text-red-600 mt-1">{result.affected_node_count} nodes turned RED</p>
          {result.alert?.leaf_label && (
            <p className="text-red-500 mt-1">Root cause: {result.alert.leaf_label}</p>
          )}
        </div>
      )}
    </div>
  );
}
