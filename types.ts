export type NodeType =
    | 'Product'
    | 'Persona'
    | 'Need'
    | 'Feature'
    | 'ValueProposition'
    | 'Constraint'
    | 'Goal';

export interface NaumuNode {
    id: string;
    label: string;
    type: NodeType | string; // Allow string for random types or future expansion
    val?: number; // for visualization size
}

export interface NaumuEdge {
    source: string;
    target: string;
    label?: string;
}

export interface KnowledgeGraph {
    nodes: NaumuNode[];
    edges: NaumuEdge[];
}
