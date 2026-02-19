import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const STATUS_COLORS = {
  green: { fill: '#10b981', stroke: '#059669', glow: '#34d399' },
  amber: { fill: '#f59e0b', stroke: '#d97706', glow: '#fbbf24' },
  red: { fill: '#ef4444', stroke: '#dc2626', glow: '#f87171' },
  unknown: { fill: '#64748b', stroke: '#475569', glow: '#94a3b8' },
};

const DARK_BG = '#0a0a0a';
const DARK_TEXT = '#e2e8f0';
const DARK_LINK = '#334155';

function buildHierarchy(nodes, expandedNodes = new Set()) {
  const nodeMap = {};
  nodes.forEach(n => { 
    nodeMap[n.node_id] = { 
      ...n, 
      children: [],
      _children: [],  // All children (hidden when collapsed)
      expanded: expandedNodes.has(n.node_id)
    }; 
  });
  
  // Build parent-child relationships
  nodes.forEach(n => {
    if (n.parent && nodeMap[n.parent]) {
      nodeMap[n.parent]._children.push(nodeMap[n.node_id]);
    }
  });
  
  // Set visible children based on expanded state
  Object.values(nodeMap).forEach(node => {
    if (node.expanded || node.node_id === 'root') {
      node.children = node._children;
    } else {
      node.children = [];
    }
  });
  
  const roots = [];
  nodes.forEach(n => {
    if (!n.parent || !nodeMap[n.parent]) {
      roots.push(nodeMap[n.node_id]);
    }
  });
  
  const rootNode = roots[0] || { 
    node_id: 'root', 
    label: 'Supply Chain Health', 
    children: [], 
    _children: [],
    status: 'unknown', 
    score: 0,
    expanded: true
  };
  
  // Always expand root
  if (rootNode.node_id === 'root') {
    rootNode.expanded = true;
    rootNode.children = rootNode._children;
  }
  
  return rootNode;
}

export default function MetricTreeCanvas({ nodes, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    // Build hierarchy first to get nodeCount
    const root = d3.hierarchy(buildHierarchy(nodes, expandedNodes));
    const nodeCount = root.descendants().length;

    const width = container.clientWidth || 1200;
    const height = Math.max(400, nodeCount * 80); // More space per node for better visibility
    
    // Adjusted margins for better content fit
    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
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

    // Zoom behavior with better constraints
    const zoom = d3.zoom()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', 
          `translate(${margin.left + event.transform.x}, ${margin.top + event.transform.y}) scale(${event.transform.k})`
        );
      });
    svg.call(zoom);

    // Reset zoom on double-click
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    });

    // Calculate tree dimensions for proper spacing
    const treeDepth = root.height;
    
    // Dynamic layout based on tree size
    const treeLayout = d3.tree()
      .size([innerWidth, innerHeight])
      .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));
    
    treeLayout(root);
    
    // Center the tree horizontally
    const nodes_data = root.descendants();
    const minX = d3.min(nodes_data, d => d.x);
    const maxX = d3.max(nodes_data, d => d.x);
    const treeWidth = maxX - minX;
    const offsetX = (innerWidth - treeWidth) / 2 - minX;
    
    nodes_data.forEach(d => {
      d.x += offsetX;
    });
    
    console.log(`Tree layout: ${nodeCount} nodes, depth: ${treeDepth}, centered with offset: ${offsetX}`);

    const handleNodeClick = (event, d) => {
      event.stopPropagation();
      
      // Handle expansion/collapse if node has children
      if (d.data._children && d.data._children.length > 0) {
        const newExpandedNodes = new Set(expandedNodes);
        if (d.data.expanded) {
          newExpandedNodes.delete(d.data.node_id);
        } else {
          newExpandedNodes.add(d.data.node_id);
        }
        setExpandedNodes(newExpandedNodes);
      }
      
      // Call original callback if provided
      onNodeClick && onNodeClick(d.data);
    };

    // Links with improved visibility
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .style('stroke-dasharray', '0');

    // Nodes
    const nodeGroup = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', d => `node ${d.data._children && d.data._children.length > 0 ? 'expandable' : ''}`)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Add interactivity
    nodeGroup.on('click', handleNodeClick)
    .on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => d.data._children && d.data._children.length > 0 ? 30 : 28);
      d3.select(this).select('circle')
        .style('filter', 'url(#glow)');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => d.data._children && d.data._children.length > 0 ? 26 : 24);
      d3.select(this).select('circle')
        .style('filter', 'none');
    });

    // Circle nodes with dynamic size for expandable nodes
    const radius = 24;
    nodeGroup.append('circle')
      .attr('r', d => d.data._children && d.data._children.length > 0 ? radius + 2 : radius)
      .attr('fill', d => STATUS_COLORS[d.data.status]?.fill || STATUS_COLORS.unknown.fill)
      .attr('stroke', d => STATUS_COLORS[d.data.status]?.stroke || STATUS_COLORS.unknown.stroke)
      .attr('stroke-width', d => {
        if (d.data.status === 'red') return 3;
        if (d.data._children && d.data._children.length > 0) return 2.5;
        return 2;
      })
      .attr('opacity', 0.9)
      .style('transition', 'r 0.2s ease')
      .classed('alert-pulse', d => d.data.status === 'red');

    // Score text inside circle
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.data.score ? d.data.score.toFixed(0) : '—');

    // Expand/collapse indicator for nodes with children
    nodeGroup.filter(d => d.data._children && d.data._children.length > 0)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '8px')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.data.expanded ? '−' : '+');

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

  }, [nodes, onNodeClick, expandedNodes]);

  return (
    <div 
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-slate-700/30 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 backdrop-blur-sm"
    >
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 px-4 py-3 border-b border-slate-700/30">
        <p className="text-xs text-slate-400 font-medium">
          Interactive Supply Chain Tree · Click nodes to expand/collapse · Double-click to reset view
        </p>
      </div>
      <svg 
        ref={svgRef} 
        className="w-full"
        style={{ 
          minHeight: '400px',
          height: 'auto',
          display: 'block',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        }} 
      />
    </div>
  );
}
