import React, { useEffect, useState } from 'react';
import { fetchComparison } from '../api';

export default function CompareView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-[#888888]">Loading comparison...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Flat vs Hierarchical Reporting</h1>
        <p className="text-[#888888] text-sm mt-1">Same supply chain data — two completely different levels of insight</p>
      </div>

      {/* Key difference callout */}
      {data?.key_difference && (
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-5">
          <p className="text-[#e0e0e0] text-sm font-medium">{data.key_difference}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* FLAT */}
        <div className="bg-[#0a0a0a] border-2 border-[#ff8888] rounded-lg overflow-hidden">
          <div className="bg-[#1a1a1a] px-5 py-3 border-b border-[#333333]">
            <h2 className="font-semibold text-[#ff8888]">Flat Report (Traditional)</h2>
            <p className="text-xs text-[#999999] mt-1">{data?.flat?.description}</p>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    {data?.flat?.columns?.map(col => (
                      <th key={col} className="px-3 py-2 text-left text-[#888888] font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.flat?.rows?.map((row, i) => (
                    <tr key={i} className="border-t border-[#2a2a2a]">
                      <td className="px-3 py-2 font-mono text-[#666666]">{row.event_id}</td>
                      <td className="px-3 py-2 text-[#d0d0d0]">{row.chip}</td>
                      <td className="px-3 py-2 text-[#888888]">{row.application}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'critical' ? 'bg-[#1a1a1a] text-[#ff6b6b] border border-[#ff6b6b]' :
                          row.status === 'delayed' ? 'bg-[#1a1a1a] text-[#e0e0e0] border border-[#555555]' :
                          'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]'
                        }`}>{row.status}</span>
                      </td>
                      <td className={`px-3 py-2 font-semibold ${row.delay_days > 0 ? 'text-[#ff6b6b]' : 'text-[#88dd88]'}`}>
                        {row.delay_days > 0 ? `+${row.delay_days}` : row.delay_days}
                      </td>
                      <td className="px-3 py-2 text-[#888888]">{row.defect_ppm?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-[#1a1a1a] rounded-lg p-3 border border-[#333333]">
              <p className="text-[#ff8888] text-xs">{data?.flat?.insight}</p>
            </div>
          </div>
        </div>

        {/* HIERARCHICAL */}
        <div className="bg-[#0a0a0a] border-2 border-[#88dd88] rounded-lg overflow-hidden">
          <div className="bg-[#1a1a1a] px-5 py-3 border-b border-[#333333]">
            <h2 className="font-semibold text-[#88dd88]">Metric Tree (ChipTrace AI)</h2>
            <p className="text-xs text-[#999999] mt-1">{data?.hierarchical?.description}</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Root score */}
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-4 ${
                data?.hierarchical?.root_status === 'red' ? 'bg-[#1a1a1a] border-[#ff6b6b] text-[#ff6b6b]' :
                data?.hierarchical?.root_status === 'amber' ? 'bg-[#1a1a1a] border-[#e0e0e0] text-[#e0e0e0]' :
                'bg-[#1a1a1a] border-[#88dd88] text-[#88dd88]'
              }`}>
                {data?.hierarchical?.root_health_score}
              </div>
              <div>
                <p className="font-semibold text-[#e0e0e0]">Supply Chain Health Score</p>
                <p className="text-xs text-[#888888]">
                  {data?.hierarchical?.red_node_count} CRITICAL · {data?.hierarchical?.amber_node_count} WARNING
                </p>
              </div>
            </div>

            {/* Root cause trace */}
            <div>
              <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">Root Cause Trace</p>
              <div className="space-y-1">
                {data?.hierarchical?.root_cause_trace?.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#555555] text-xs">{Array(i + 1).join('  ')}{'→'}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      node.status === 'red' ? 'bg-[#1a1a1a] text-[#ff6b6b] border border-[#ff6b6b]' :
                      node.status === 'amber' ? 'bg-[#1a1a1a] text-[#e0e0e0] border border-[#555555]' :
                      'bg-[#1a1a1a] text-[#88dd88] border border-[#333333]'
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
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">Critical Nodes</p>
                <div className="space-y-1">
                  {data?.hierarchical?.critical_nodes?.map((n, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2 border border-[#333333]">
                      <span className="text-xs text-[#ff8888]">{n.label}</span>
                      <span className="text-xs font-bold text-[#ff6b6b]">{n.score?.toFixed(0)}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#333333]">
              <p className="text-[#88dd88] text-xs">{data?.hierarchical?.insight}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
