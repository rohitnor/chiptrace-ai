import React, { useEffect, useState } from 'react';
import { fetchDisruptions } from '../api';

export default function DisruptionDetail() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisruptions(30).then(r => setDisruptions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading disruptions...</div>;

  const severityBadge = (s) => ({
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-700',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Disruption Log</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Triggered Node', 'Type', 'Severity', 'OEM Impact', 'Predicted Res.', 'Actual Res.', 'Triggered At', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {disruptions.map((d) => (
              <tr key={d.disruption_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-xs truncate">{d.triggered_node_id}</td>
                <td className="px-4 py-3 text-gray-700 capitalize">{d.disruption_type?.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityBadge(d.severity)}`}>
                    {d.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{d.oem_impact_days ?? '—'}d</td>
                <td className="px-4 py-3 text-gray-700">{d.predicted_resolution_days ?? '—'}d</td>
                <td className="px-4 py-3 text-gray-700">{d.actual_resolution_days ?? '—'}d</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {d.triggered_at ? new Date(d.triggered_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    d.resolved_at ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
