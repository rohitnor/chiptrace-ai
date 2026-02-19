import React, { useState } from 'react';
import { useMetricTree, usePredictions } from '../hooks';
import MetricTreeCanvas from '../components/MetricTree/TreeCanvas';
import PredictionCards from '../components/Predictions/PredictionCards';
import DisruptionsPanel from '../components/MetricTree/DisruptionsPanel';
import SimulatePanel from '../components/MetricTree/SimulatePanel';

export default function Dashboard() {
  const { data: treeData, loading, error, refetch } = useMetricTree();
  const { predictions, loading: predLoading } = usePredictions();
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border border-[#333333] border-t-[#e0e0e0] mx-auto mb-6" />
          <p className="text-[#888888] text-lg tracking-wide">Analyzing supply chain metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="backdrop-blur-md bg-[#1a1a1a] border border-[#333333] rounded-lg p-8 max-w-md">
          <h3 className="text-[#ff6b6b] font-semibold text-lg">Connection Error</h3>
          <p className="text-[#d0d0d0] text-sm mt-2">{error}</p>
          <p className="text-[#777777] text-xs mt-3">Ensure the backend is running on port 8000</p>
          <button
            onClick={refetch}
            className="mt-6 w-full py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#d0d0d0] text-sm font-medium rounded-lg transition-all border border-[#333333]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const rootScore = treeData?.root_score || 0;
  const rootStatus = treeData?.root_status || 'unknown';
  const redNodeCount = treeData?.nodes?.filter(n => n.status === 'red').length || 0;
  const amberNodeCount = treeData?.nodes?.filter(n => n.status === 'amber').length || 0;
  const totalNodes = treeData?.total_nodes || 0;

  const getStatusGlow = (status) => {
    const glows = {
      red: 'from-red-600/40 to-transparent',
      amber: 'from-amber-600/40 to-transparent',
      green: 'from-green-600/40 to-transparent',
    };
    return glows[status] || 'from-slate-600/40 to-transparent';
  };

  const getStatusAccent = (status) => {
    const accents = {
      red: 'text-red-400 border-red-900/50',
      amber: 'text-amber-400 border-amber-900/50',
      green: 'text-green-400 border-green-900/50',
    };
    return accents[status] || 'text-slate-400 border-slate-800/50';
  };

  return (
    <div className="min-h-screen bg-[#000000] p-8">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#f5f5f5] tracking-tight">Supply Chain Intelligence</h1>
            <p className="text-[#888888] text-sm mt-2">
              Automotive Legacy Semiconductor | OEM ↔ N-Tier Metric Tree Analysis
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#d0d0d0] text-sm font-medium rounded-lg border border-[#333333] transition-all duration-300"
          >
            Refresh
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6 transition-all">
            <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">System Health</p>
            <p className="text-5xl font-black mt-3 text-[#e0e0e0]">
              {rootScore.toFixed(0)}
            </p>
            <p className="text-[#777777] text-xs mt-2 capitalize">{rootStatus} Status</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6 transition-all">
            <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">Critical</p>
            <p className="text-5xl font-black mt-3 text-[#ff6b6b]">{redNodeCount}</p>
            <p className="text-[#777777] text-xs mt-2">nodes at risk</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6 transition-all">
            <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">Monitoring</p>
            <p className="text-5xl font-black mt-3 text-[#e0e0e0]">{amberNodeCount}</p>
            <p className="text-[#777777] text-xs mt-2">under observation</p>
          </div>

          <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6 transition-all">
            <p className="text-[#888888] text-xs font-semibold uppercase tracking-widest">Total Nodes</p>
            <p className="text-5xl font-black mt-3 text-[#e0e0e0]">{totalNodes}</p>
            <p className="text-[#777777] text-xs mt-2">in hierarchy</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Metric Tree */}
          <div className="col-span-2">
            <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6 transition-all">
              <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4 tracking-tight">Metric Tree Hierarchy</h2>
              <MetricTreeCanvas
                nodes={treeData?.nodes || []}
                onNodeClick={setSelectedNode}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Predictions */}
            <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4 tracking-tight">ML Predictions</h2>
              <PredictionCards 
                predictions={predictions} 
                selectedNode={selectedNode}
                loading={predLoading}
              />
            </div>

            {/* Disruptions */}
            <DisruptionsPanel />

            {/* Simulate */}
            <SimulatePanel onSimulated={refetch} />
          </div>
        </div>
      </div>
    </div>
  );
}
