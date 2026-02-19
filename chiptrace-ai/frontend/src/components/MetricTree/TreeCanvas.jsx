import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const STATUS_COLORS = {
  green: { fill: '#DCFCE7', stroke: '#16A34A', text: '#15803D' },
  amber: { fill: '#FEF9C3', stroke: '#D97706', text: '#92400E' },
  red: { fill: '#FEE2E2', stroke: '#DC2626', text: '#991B1B' },
  unknown: { fill: '#F3F4F6', stroke: '#9CA3AF', text: '#374151' },
};

function buildHierarchy(nodes) {
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.node_id] = { ...n, children: [] }; });
  const roots = [];
  nodes.forEach(n => {
    if (!n.parent || !nodeMap[n.parent]) {
      roots.push(nodeMap[n.node_id]);
    } else {
      nodeMap[n.parent].children.push(nodeMap[n.node_id]);
    }
  });
  return roots[0] || { node_id: 'root', label: 'Root', children: [], status: 'unknown', score: 0 };
}

export default function MetricTreeCanvas({ nodes, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container.clientWidth || 800;
    const height = 520;
    const margin = { top: 30, right: 20, bottom: 20, left: 20 };

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Zoom
    const zoom = d3.zoom().scaleExtent([0.3, 2]).on('zoom', (e) => {
      g.attr('transform', e.transform);
    });
    svg.call(zoom);

    const root = d3.hierarchy(buildHierarchy(nodes));
    const treeLayout = d3.tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    treeLayout(root);

    // Links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

    // Nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onNodeClick && onNodeClick(d.data);
      });

    const r = 22;
    node.append('circle')
      .attr('r', r)
      .attr('fill', d => STATUS_COLORS[d.data.status]?.fill || STATUS_COLORS.unknown.fill)
      .attr('stroke', d => STATUS_COLORS[d.data.status]?.stroke || STATUS_COLORS.unknown.stroke)
      .attr('stroke-width', d => d.data.status === 'red' ? 3 : 2)
      .attr('class', d => d.data.status === 'red' ? 'alert-pulse' : '');

    // Score text inside circle
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', d => STATUS_COLORS[d.data.status]?.text || '#374151')
      .text(d => d.data.score ? d.data.score.toFixed(0) : '');

    // Label below
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', r + 12)
      .attr('font-size', '8px')
      .attr('fill', '#6B7280')
      .text(d => {
        const label = d.data.label || d.data.node_id || '';
        return label.length > 18 ? label.substring(0, 17) + '…' : label;
      });

  }, [nodes, onNodeClick]);

  return (
    <div className="overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-xs text-gray-400 px-3 pt-2">Scroll to zoom · Drag to pan · Click node to inspect</p>
      <svg ref={svgRef} className="w-full" style={{ minHeight: 520 }} />
    </div>
  );
}
