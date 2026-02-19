import React, { useState } from 'react';
import { useMetricTree, usePredictions } from '../hooks';
import MetricTreeCanvas from '../components/MetricTree/TreeCanvas';
import PredictionCards from '../components/Predictions/PredictionCards';
import DisruptionsPanel from '../components/MetricTree/DisruptionsPanel';
import SimulatePanel from '../components/MetricTree/SimulatePanel';

/* ── Helpers ─────────────────────────────────── */
function statusTextColor(status) {
  const map = { red: '#D97070', amber: '#C9A84C', green: '#5BAD82' };
  return map[status] || '#A0A0A0';
}

/* ── KPI Card ─────────────────────────────────── */
function KpiCard({ label, value, sub, accentHex, delay = 0 }) {
  return (
    <div
      className="glass-card rounded-2xl p-6 flex flex-col gap-2 fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="label-xs">{label}</p>
      <p
        className="text-5xl font-black tracking-tight leading-none"
        style={{ color: accentHex || '#F0F0F0' }}
      >
        {value}
      </p>
      <p className="text-[#505050] text-xs mt-1">{sub}</p>
    </div>
  );
}

/* ── Loading Screen ───────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
      <div
        className="w-12 h-12 rounded-full border border-white/10 border-t-white/60 animate-spin"
        style={{ borderTopColor: 'rgba(255,255,255,0.55)' }}
      />
      <p className="text-[#505050] text-sm tracking-widest uppercase">
        Analyzing supply chain metrics
      </p>
    </div>
  );
}

/* ── Error Screen ─────────────────────────────── */
function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-dark rounded-2xl p-8 max-w-sm w-full fade-up">
        <div className="w-10 h-10 rounded-xl badge-critical flex items-center justify-center mb-5">
          <span className="text-lg font-black" style={{ color: '#D97070' }}>!</span>
        </div>
        <h3 className="text-[#D97070] font-semibold text-base mb-2">Connection Error</h3>
        <p className="text-[#888] text-sm leading-relaxed">{error}</p>
        <p className="text-[#484848] text-xs mt-3">Ensure the backend is running on port 8000</p>
        <button
          onClick={onRetry}
          className="mt-6 w-full py-2.5 glass rounded-xl text-[#c0c0c0] text-sm font-medium 
                     hover:bg-white/[0.09] transition-all"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────── */
export default function Dashboard() {
  const { data: treeData, loading, error, refetch } = useMetricTree();
  const { predictions, loading: predLoading } = usePredictions();
  const [selectedNode, setSelectedNode] = useState(null);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={refetch} />;

  const rootScore = treeData?.root_score || 0;
  const rootStatus = treeData?.root_status || 'unknown';
  const redCount = treeData?.nodes?.filter(n => n.status === 'red').length || 0;
  const amberCount = treeData?.nodes?.filter(n => n.status === 'amber').length || 0;
  const totalNodes = treeData?.total_nodes || 0;

  return (
    <div className="space-y-8 fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#E8E8E8] tracking-tight leading-none">
            Supply Chain Intelligence
          </h1>
          <p className="text-[#484848] text-xs tracking-widest uppercase mt-3">
            Automotive Legacy Semiconductor — OEM to N-Tier Metric Tree Analysis
          </p>
        </div>
        <button
          onClick={refetch}
          className="glass-card rounded-xl px-4 py-2.5 text-[#808080] text-xs font-semibold tracking-widest
                     uppercase hover:text-[#d0d0d0] hover:bg-white/[0.08] transition-all"
        >
          Refresh
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="System Health"
          value={rootScore.toFixed(0)}
          sub={`${rootStatus.toUpperCase()} status`}
          accentHex={statusTextColor(rootStatus)}
          delay={0}
        />
        <KpiCard
          label="Critical Nodes"
          value={redCount}
          sub="nodes at risk"
          accentHex="#D97070"
          delay={60}
        />
        <KpiCard
          label="Under Monitoring"
          value={amberCount}
          sub="flagged for observation"
          accentHex="#C9A84C"
          delay={120}
        />
        <KpiCard
          label="Total Nodes"
          value={totalNodes}
          sub="in hierarchy"
          accentHex="#A0A0A0"
          delay={180}
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Metric Tree — 2/3 width */}
        <div className="col-span-2 glass-dark rounded-2xl p-6 fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[#D8D8D8] text-base font-semibold tracking-tight">
                Supply Chain Metric Tree
              </h2>
              <p className="label-xs mt-1">Click a node to inspect its metrics</p>
            </div>
            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[#505050] text-[10px] font-semibold tracking-widest uppercase">Interactive</span>
            </div>
          </div>
          <MetricTreeCanvas
            nodes={treeData?.nodes || []}
            onNodeClick={setSelectedNode}
          />
        </div>

        {/* Right sidebar — 1/3 width */}
        <div className="space-y-5">

          {/* ML Predictions */}
          <div className="glass-dark rounded-2xl p-5 fade-up" style={{ animationDelay: '260ms' }}>
            <h2 className="text-[#C0C0C0] text-sm font-semibold tracking-tight mb-4">
              ML Predictions
            </h2>
            <PredictionCards
              predictions={predictions}
              selectedNode={selectedNode}
              loading={predLoading}
            />
          </div>

          {/* Recent Disruptions */}
          <div className="fade-up" style={{ animationDelay: '320ms' }}>
            <DisruptionsPanel />
          </div>

          {/* Scenario Simulation */}
          <div className="fade-up" style={{ animationDelay: '380ms' }}>
            <SimulatePanel onSimulated={refetch} />
          </div>

        </div>
      </div>
    </div>
  );
}
