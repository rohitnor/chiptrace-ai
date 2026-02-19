import React, { useState } from 'react';
import { useMetricTree, useAlerts, usePredictions } from '../hooks';
import MetricTreeCanvas from '../components/MetricTree/TreeCanvas';
import AlertBanner from '../components/MetricTree/AlertBanner';
import PredictionCards from '../components/Predictions/PredictionCards';
import SimulatePanel from '../components/MetricTree/SimulatePanel';

export default function Dashboard() {
  const { data: treeData, loading, error, refetch } = useMetricTree();
  const { alerts } = useAlerts();
  const { predictions } = usePredictions();
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4" />
          <p className="text-gray-500">Loading metric tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Cannot connect to backend</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <p className="text-gray-500 text-xs mt-2">Make sure backend is running on port 8000</p>
      </div>
    );
  }

  const rootScore = treeData?.root_score || 0;
  const rootStatus = treeData?.root_status || 'unknown';

  const statusColor = {
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }[rootStatus] || 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Chain Health Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Automotive Legacy Semiconductor — OEM ↔ N-Tier Metric Tree
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition"
        >
          Refresh Tree
        </button>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`border rounded-xl p-5 ${statusColor}`}>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">Root Health Score</p>
          <p className="text-4xl font-bold mt-2">{rootScore.toFixed(1)}</p>
          <p className="text-sm mt-1 capitalize font-medium">{rootStatus}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">RED Nodes</p>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {treeData?.nodes?.filter(n => n.status === 'red').length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Critical alerts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">AMBER Nodes</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">
            {treeData?.nodes?.filter(n => n.status === 'amber').length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Monitoring</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Nodes</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">{treeData?.total_nodes || 0}</p>
          <p className="text-sm text-gray-500 mt-1">In metric tree</p>
        </div>
      </div>

      {/* Metric Tree + Predictions */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Metric Tree</h2>
          <MetricTreeCanvas
            nodes={treeData?.nodes || []}
            onNodeClick={setSelectedNode}
          />
        </div>
        <div className="space-y-4">
          <PredictionCards predictions={predictions} selectedNode={selectedNode} />
          <SimulatePanel onSimulated={refetch} />
        </div>
      </div>
    </div>
  );
}
