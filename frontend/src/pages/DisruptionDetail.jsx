import React, { useEffect, useState } from 'react';
import { fetchDisruptions } from '../api';

export default function DisruptionDetail() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisruptions(30).then(r => setDisruptions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-[#888888]">Loading disruptions...</div>;

  const severityBadge = (s) => ({
    critical: 'bg-[#1a1a1a] text-[#ff6b6b] border border-[#ff6b6b]',
    high: 'bg-[#1a1a1a] text-[#ff9999] border border-[#ff8888]',
    medium: 'bg-[#1a1a1a] text-[#e0e0e0] border border-[#555555]',
    low: 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]',
  }[s] || 'bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a]');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f5f5f5]">Disruption Log</h1>
      <div className="bg-[#0a0a0a] rounded-lg border border-[#333333] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1a1a] border-b border-[#333333]">
            <tr>
              {['Triggered Node', 'Type', 'Severity', 'OEM Impact', 'Predicted Res.', 'Actual Res.', 'Triggered At', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {disruptions.map((d) => (
              <tr key={d.disruption_id} className="hover:bg-[#1a1a1a] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[#666666] max-w-xs truncate">{d.triggered_node_id}</td>
                <td className="px-4 py-3 text-[#d0d0d0] capitalize">{d.disruption_type?.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityBadge(d.severity)}`}>
                    {d.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#d0d0d0]">{d.oem_impact_days ?? '—'}d</td>
                <td className="px-4 py-3 text-[#d0d0d0]">{d.predicted_resolution_days ?? '—'}d</td>
                <td className="px-4 py-3 text-[#d0d0d0]">{d.actual_resolution_days ?? '—'}d</td>
                <td className="px-4 py-3 text-xs text-[#666666]">
                  {d.triggered_at ? new Date(d.triggered_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    d.resolved_at ? 'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]' : 'bg-[#1a1a1a] text-[#ff6b6b] border border-[#ff6b6b]'
                  }`}>
                    {d.resolved_at ? 'Resolved' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
