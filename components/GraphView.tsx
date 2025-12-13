import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div>Loading Graph...</div>
});

// Map types to colors
const NODE_COLORS: Record<string, string> = {
    Product: '#FF6B6B',      // Red
    Persona: '#4ECDC4',      // Teal
    Need: '#FFE66D',         // Yellow
    Feature: '#1A535C',      // Dark Blue
    ValueProposition: '#FF9F1C', // Orange
    Constraint: '#555555',   // Grey
    Goal: '#95E1D3'          // Light Green
};

import type { KnowledgeGraph } from '../types';

interface GraphViewProps {
    data: KnowledgeGraph;
}

export function GraphView({ data }: GraphViewProps) {
    const fgRef = useRef<any>();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });

            const handleResize = () => {
                setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        const fg = fgRef.current;
        // Check if fg is defined and has the d3Force method
        if (fg && typeof fg.d3Force === 'function') {
            // Adjust forces to reduce clutter
            fg.d3Force('charge').strength(-800); // Stronger repulsion for more spread
            fg.d3Force('link').distance(150); // Longer links

            // Re-heat simulation if method exists
            if (typeof fg.d3ReheatSimulation === 'function') {
                fg.d3ReheatSimulation();
            }
        }
    }, [data]); // Re-apply if data changes/graph re-renders

    // Wait for client-side hydration and size
    if (windowSize.width === 0) {
        return null;
    }

    return (
        <div className="force-graph-container" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 10, pointerEvents: 'auto' }}>
            <ForceGraph2D
                ref={fgRef}
                width={windowSize.width}
                height={windowSize.height}
                graphData={{ nodes: data.nodes, links: data.edges }}
                nodeAutoColorBy="type"
                nodeLabel="label"
                linkLabel="label"
                backgroundColor="rgba(0,0,0,0)"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                enableNodeDrag={true}
                onNodeDragEnd={(node: any) => {
                    node.fx = node.x;
                    node.fy = node.y;
                }}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Comfortaa, sans-serif`;

                    // Draw Node
                    const color = NODE_COLORS[node.type] || '#ccc';
                    const r = 4; // Fixed radius matching visual

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Draw Label & Type
                    if (label) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        // Main Label
                        ctx.fillStyle = '#333';
                        ctx.fillText(label, node.x, node.y + r + fontSize);

                        // Type Label
                        const type = node.type;
                        const typeFontSize = 8 / globalScale;
                        ctx.font = `italic ${typeFontSize}px Comfortaa, sans-serif`;
                        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
                        ctx.fillText(type, node.x, node.y + r + fontSize + typeFontSize + 2);
                    }
                }}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    const r = 12; // Radius 12 for generous hit area
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
            />
        </div>
    );
}
