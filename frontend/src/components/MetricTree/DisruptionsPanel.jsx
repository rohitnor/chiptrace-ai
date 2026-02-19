import React, { useState, useEffect } from 'react';
import { fetchDisruptions } from '../../api';

// Removed emoji icons - using labels instead
const DISRUPTION_TYPES = {
  fab_capacity: 'Fab',
  logistics: 'Logistics',
  quality: 'Quality',
  material: 'Material',
  financial: 'Financial',
};

const SEVERITY_COLORS = {
  low: 'from-[#1a1a1a] border-[#333333] text-[#88dd88]',
  medium: 'from-[#1a1a1a] border-[#444444] text-[#e0e0e0]',
  high: 'from-[#1a1a1a] border-[#555555] text-[#ff9999]',
  critical: 'from-[#1a1a1a] border-[#666666] text-[#ff6b6b]',
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
        console.error('Failed to load disruptions:', e);
        setDisruptions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6">
      <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4 tracking-tight">Recent Disruptions</h2>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#1a1a1a] rounded-lg animate-pulse border border-[#222222]"></div>
          ))}
        </div>
      ) : disruptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-[#555555] text-4xl mb-2">[OK]</div>
          <p className="text-[#777777] text-sm">No active disruptions detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disruptions.map((d, i) => {
            const severityColor = SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.medium;
            const typeLabel = DISRUPTION_TYPES[d.type] || 'Unknown';
            
            return (
              <div
                key={i}
                className={`backdrop-blur-md bg-gradient-to-r ${severityColor} border rounded-lg p-4 transition-all hover:border-opacity-100`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#e0e0e0] capitalize line-clamp-1">
                        {typeLabel}
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-[#0a0a0a] capitalize text-[#999999]`}>
                        {d.severity}
                      </span>
                    </div>
                    {d.description && (
                      <p className="text-xs text-[#888888] line-clamp-2">{d.description}</p>
                    )}
                    {d.affected_node_count !== undefined && (
                      <p className="text-xs text-[#777777] mt-2">
                        {d.affected_node_count} node{d.affected_node_count !== 1 ? 's' : ''} affected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
