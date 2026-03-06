import React, { useState, useEffect, useRef } from 'react';
import { Network, Search, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface MemoryNode {
  id: string;
  title: string;
  type: string;
  date: string;
  tags: string[];
  related: string[];
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface MemoryGraphProps {
  onSelectMemory: (path: string) => void;
  onClose: () => void;
}

export function MemoryGraph({ onSelectMemory, onClose }: MemoryGraphProps) {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/brain-data?limit=100');
      if (response.ok) {
        const data = await response.json();
        
        // Parse files into nodes
        const parsedNodes: MemoryNode[] = data.files.map((file: any) => ({
          id: file.path,
          title: file.title,
          type: file.type,
          date: file.date,
          tags: file.tags || [],
          related: file.related || []
        }));

        // Create links from related field
        const parsedLinks: GraphLink[] = [];
        parsedNodes.forEach((node) => {
          node.related.forEach((relatedPath) => {
            const targetNode = parsedNodes.find((n) => n.id.includes(relatedPath));
            if (targetNode) {
              parsedLinks.push({
                source: node.id,
                target: targetNode.id
              });
            }
          });
        });

        // Add links based on shared tags
        parsedNodes.forEach((node, i) => {
          parsedNodes.slice(i + 1).forEach((otherNode) => {
            const sharedTags = node.tags.filter((tag) => otherNode.tags.includes(tag));
            if (sharedTags.length > 0) {
              parsedLinks.push({
                source: node.id,
                target: otherNode.id
              });
            }
          });
        });

        // Calculate positions using simple force simulation
        const positionedNodes = calculatePositions(parsedNodes, parsedLinks);
        
        setNodes(positionedNodes);
        setLinks(parsedLinks);
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePositions = (nodes: MemoryNode[], links: GraphLink[]): MemoryNode[] => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Initialize positions in a circle
    const positionedNodes = nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    // Simple force simulation
    for (let iteration = 0; iteration < 100; iteration++) {
      // Repulsion between all nodes
      for (let i = 0; i < positionedNodes.length; i++) {
        for (let j = i + 1; j < positionedNodes.length; j++) {
          const nodeA = positionedNodes[i];
          const nodeB = positionedNodes[j];
          const dx = nodeB.x! - nodeA.x!;
          const dy = nodeB.y! - nodeA.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 100) {
            const force = 1000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            nodeA.x! -= fx;
            nodeA.y! -= fy;
            nodeB.x! += fx;
            nodeB.y! += fy;
          }
        }
      }

      // Attraction along links
      links.forEach((link) => {
        const source = positionedNodes.find((n) => n.id === link.source);
        const target = positionedNodes.find((n) => n.id === link.target);
        
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = (dist - 100) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          source.x! += fx;
          source.y! += fy;
          target.x! -= fx;
          target.y! -= fy;
        }
      });

      // Center gravity
      positionedNodes.forEach((node) => {
        const dx = centerX - node.x!;
        const dy = centerY - node.y!;
        node.x! += dx * 0.01;
        node.y! += dy * 0.01;
      });
    }

    return positionedNodes;
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'memory': return '#a855f7'; // purple
      case 'handoff': return '#f97316'; // orange
      case 'decision': return '#eab308'; // yellow
      case 'doc': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const filteredNodes = nodes.filter((node) =>
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    onSelectMemory(nodeId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <Network className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white">Building memory graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Linked Memories</h2>
            <p className="text-xs text-gray-500">{nodes.length} memories • {links.length} connections</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-64"
            />
          </div>
          
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
            className="p-2 bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.5))}
            className="p-2 bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={fetchGraphData}
            className="p-2 bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          className="cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Links */}
          {links.map((link, i) => {
            const source = nodes.find((n) => n.id === link.source);
            const target = nodes.find((n) => n.id === link.target);
            if (!source || !target) return null;
            
            const isHighlighted = filteredNodes.includes(source) && filteredNodes.includes(target);
            
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#4b5563' : '#374151'}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={searchQuery && !isHighlighted ? 0.1 : 0.6}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isFiltered = filteredNodes.includes(node);
            const isSelected = selectedNode === node.id;
            
            if (searchQuery && !isFiltered) {
              return null;
            }
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isSelected ? 25 : 20}
                  fill={getNodeColor(node.type)}
                  opacity={isSelected ? 1 : 0.8}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                />
                
                <text
                  y={35}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {node.title.slice(0, 15)}{node.title.length > 15 ? '...' : ''}
                </text>
                
                <text
                  y={-30}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="8"
                  className="pointer-events-none"
                >
                  {node.tags.slice(0, 2).join(', ')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-[#161616] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Memory Types</p>
          <div className="space-y-1">
            {[
              { type: 'memory', label: 'Memory', color: '#a855f7' },
              { type: 'handoff', label: 'Handoff', color: '#f97316' },
              { type: 'decision', label: 'Decision', color: '#eab308' },
              { type: 'doc', label: 'Document', color: '#3b82f6' }
            ].map(({ type, label, color }) => (
              <div key={type} className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 bg-[#161616] rounded-lg p-4 border border-gray-800 max-w-xs">
            {(() => {
              const node = nodes.find((n) => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <>
                  <h3 className="text-sm font-semibold text-white mb-1">{node.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">Type: {node.type}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {node.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onSelectMemory(node.id)}
                    className="w-full py-2 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30"
                  >
                    View Memory
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
