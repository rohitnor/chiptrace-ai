import React, { useEffect, useState } from 'react';
import { fetchComparison } from '../api';

export default function CompareView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading comparison...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flat vs Hierarchical Reporting</h1>
        <p className="text-gray-500 text-sm mt-1">Same supply chain data — two completely different levels of insight</p>
      </div>

      {/* Key difference callout */}
      {data?.key_difference && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 text-sm font-medium">💡 {data.key_difference}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* FLAT */}
        <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-200">
            <h2 className="font-semibold text-red-800">❌ Flat Report (Traditional)</h2>
            <p className="text-xs text-red-600 mt-1">{data?.flat?.description}</p>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {data?.flat?.columns?.map(col => (
                      <th key={col} className="px-3 py-2 text-left text-gray-600 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.flat?.rows?.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-gray-400">{row.event_id}</td>
                      <td className="px-3 py-2 text-gray-700">{row.chip}</td>
                      <td className="px-3 py-2 text-gray-500">{row.application}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'critical' ? 'bg-red-100 text-red-700' :
                          row.status === 'delayed' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{row.status}</span>
                      </td>
                      <td className={`px-3 py-2 font-semibold ${row.delay_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {row.delay_days > 0 ? `+${row.delay_days}` : row.delay_days}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.defect_ppm?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-red-50 rounded-lg p-3">
              <p className="text-red-700 text-xs">{data?.flat?.insight}</p>
            </div>
          </div>
        </div>

        {/* HIERARCHICAL */}
        <div className="bg-white border-2 border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 px-5 py-3 border-b border-green-200">
            <h2 className="font-semibold text-green-800">✅ Metric Tree (ChipTrace AI)</h2>
            <p className="text-xs text-green-600 mt-1">{data?.hierarchical?.description}</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Root score */}
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-4 ${
                data?.hierarchical?.root_status === 'red' ? 'bg-red-50 border-red-500 text-red-700' :
                data?.hierarchical?.root_status === 'amber' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                'bg-green-50 border-green-500 text-green-700'
              }`}>
                {data?.hierarchical?.root_health_score}
              </div>
              <div>
                <p className="font-semibold text-gray-800">Supply Chain Health Score</p>
                <p className="text-xs text-gray-500">
                  {data?.hierarchical?.red_node_count} RED · {data?.hierarchical?.amber_node_count} AMBER
                </p>
              </div>
            </div>

            {/* Root cause trace */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Root Cause Trace</p>
              <div className="space-y-1">
                {data?.hierarchical?.root_cause_trace?.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-gray-300 text-xs">{Array(i + 1).join('  ')}{'→'}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      node.status === 'red' ? 'bg-red-100 text-red-700' :
                      node.status === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {node.label}
                      <span className="ml-1 opacity-70">({node.score?.toFixed(0)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical nodes */}
            {data?.hierarchical?.critical_nodes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Critical Nodes</p>
                <div className="space-y-1">
                  {data?.hierarchical?.critical_nodes?.map((n, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-red-800">{n.label}</span>
                      <span className="text-xs font-bold text-red-600">{n.score?.toFixed(0)}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-700 text-xs">{data?.hierarchical?.insight}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
