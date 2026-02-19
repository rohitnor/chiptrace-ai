import React, { useState, useEffect } from 'react';
import { fetchDisruptions } from '../../api';

const TYPE_LABEL = {
  fab_capacity: 'Fab Capacity',
  logistics: 'Logistics',
  quality: 'Quality',
  material: 'Material',
  financial: 'Financial',
};

const SEVERITY_STYLE = {
  low: { color: '#5BAD82', bg: 'rgba(30,92,58,0.12)', border: 'rgba(30,92,58,0.30)' },
  medium: { color: '#C9A84C', bg: 'rgba(122,92,30,0.12)', border: 'rgba(122,92,30,0.30)' },
  high: { color: '#D97070', bg: 'rgba(139,32,32,0.12)', border: 'rgba(139,32,32,0.28)' },
  critical: { color: '#D97070', bg: 'rgba(139,32,32,0.18)', border: 'rgba(139,32,32,0.40)' },
};

export default function DisruptionsPanel() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchDisruptions(5);
        setDisruptions(res.data?.disruptions || []);
      } catch (e) {
        setDisruptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-dark rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#C0C0C0] text-sm font-semibold tracking-tight">Recent Disruptions</h2>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#8B2020' }} />
          <span className="text-[#484848] text-[10px] tracking-widest uppercase font-semibold">Live</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 shimmer rounded-xl" />
          ))}
        </div>

      ) : disruptions.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(30,92,58,0.15)', border: '1px solid rgba(30,92,58,0.35)' }}
          >
            <span className="text-[#5BAD82] text-xs font-bold">OK</span>
          </div>
          <p className="text-[#484848] text-xs">No active disruptions detected</p>
        </div>

      ) : (
        <div className="space-y-2.5">
          {disruptions.map((d, i) => {
            const sty = SEVERITY_STYLE[d.severity] || SEVERITY_STYLE.medium;
            return (
              <div
                key={i}
                className="rounded-xl p-3.5 transition-all"
                style={{ background: sty.bg, border: `1px solid ${sty.border}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-[#D8D8D8] leading-tight">
                    {TYPE_LABEL[d.type] || 'Unknown'}
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
                    style={{ color: sty.color, background: 'rgba(0,0,0,0.30)' }}
                  >
                    {d.severity}
                  </span>
                </div>
                {d.description && (
                  <p className="text-[#606060] text-xs leading-relaxed line-clamp-2">
                    {d.description}
                  </p>
                )}
                {d.affected_node_count !== undefined && (
                  <p className="text-[#484848] text-[10px] mt-1.5">
                    {d.affected_node_count} node{d.affected_node_count !== 1 ? 's' : ''} affected
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
