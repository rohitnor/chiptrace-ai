import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const STATUS_COLORS = {
  green: { fill: '#10b981', stroke: '#059669', glow: '#34d399' },
  amber: { fill: '#f59e0b', stroke: '#d97706', glow: '#fbbf24' },
  red: { fill: '#ef4444', stroke: '#dc2626', glow: '#f87171' },
  unknown: { fill: '#64748b', stroke: '#475569', glow: '#94a3b8' },
};

const DARK_BG = '#0f172a';
const DARK_TEXT = '#e2e8f0';
const DARK_LINK = '#334155';

function buildHierarchy(nodes) {
  const nodeMap = {};
  nodes.forEach(n => { 
    nodeMap[n.node_id] = { 
      ...n, 
      children: [] 
    }; 
  });
  
  const roots = [];
  nodes.forEach(n => {
    if (!n.parent || !nodeMap[n.parent]) {
      roots.push(nodeMap[n.node_id]);
    } else {
      nodeMap[n.parent].children.push(nodeMap[n.node_id]);
    }
  });
  
  return roots[0] || { 
    node_id: 'root', 
    label: 'Root', 
    children: [], 
    status: 'unknown', 
    score: 0 
  };
}

export default function MetricTreeCanvas({ nodes, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1000;
    const height = 600;
    
    // Increased margins for better spacing
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', DARK_BG);

    // Defs for gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    filter.append('feMerge').selectAll('feMergeNode')
      .data([0, 1])
      .enter()
      .append('feMergeNode')
      .attr('in', d => d === 0 ? 'coloredBlur' : 'SourceGraphic');

    // Main group with zoom capability
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Build hierarchy
    const root = d3.hierarchy(buildHierarchy(nodes));
    
    // CRITICAL FIX: D3 tree layout with MASSIVE horizontal spacing to prevent overlapping
    // nodeSize() sets the size allocated to each node (width x height)
    // Much larger width (150) ensures horizontal separation of text labels
    // separation() multiplier further increases spacing between siblings
    const treeLayout = d3.tree()
      .nodeSize([150, 100])  // [width per node, height per node] - 150px width is critical for spacing
      .separation((a, b) => (a.parent === b.parent ? 3 : 4));  // Amplify spacing: 3x for siblings, 4x for cousins
    
    treeLayout(root);
    
    console.log('D3 Tree rendered with fixed spacing - nodeSize: [150, 100], separation multipliers: 3/4');

    // Links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', DARK_LINK)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const nodeGroup = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Add interactivity
    nodeGroup.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick && onNodeClick(d.data);
    })
    .on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => 28);
      d3.select(this).select('circle')
        .style('filter', 'url(#glow)');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => 24);
      d3.select(this).select('circle')
        .style('filter', 'none');
    });

    // Circle nodes
    const radius = 24;
    nodeGroup.append('circle')
      .attr('r', radius)
      .attr('fill', d => STATUS_COLORS[d.data.status]?.fill || STATUS_COLORS.unknown.fill)
      .attr('stroke', d => STATUS_COLORS[d.data.status]?.stroke || STATUS_COLORS.unknown.stroke)
      .attr('stroke-width', d => d.data.status === 'red' ? 3 : 2)
      .attr('opacity', 0.9)
      .style('transition', 'r 0.2s ease')
      .classed('alert-pulse', d => d.data.status === 'red');

    // Score text inside circle
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.data.score ? d.data.score.toFixed(0) : '—');

    // Label below nodes
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', radius + 18)
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', DARK_TEXT)
      .attr('pointer-events', 'none')
      .text(d => {
        const label = d.data.label || d.data.node_id || '';
        return label.length > 16 ? label.substring(0, 15) + '…' : label;
      });

  }, [nodes, onNodeClick]);

  return (
    <div 
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-slate-800/50"
    >
      <p className="text-xs text-slate-500 px-4 pt-3 pb-0 bg-slate-950/40">
        Scroll to zoom · Drag to pan · Click node to inspect
      </p>
      <svg 
        ref={svgRef} 
        className="w-full"
        style={{ 
          minHeight: '600px',
          display: 'block'
        }} 
      />
    </div>
  );
}
