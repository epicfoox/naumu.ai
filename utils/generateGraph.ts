export function generateInitialGraph() {
    const nodes = [];
    const edges = [];
    const types = ['Product', 'Persona', 'Need', 'Feature', 'ValueProposition', 'Constraint', 'Goal'];
    const count = 40;

    for (let i = 0; i < count; i++) {
        const id = `node-${i}`;
        nodes.push({
            id,
            label: '', // No labels for ambient background
            type: types[Math.floor(Math.random() * types.length)],
            val: Math.random() * 2 + 1
        });
    }

    // Create a few random connections to simulate 'messy mind'
    for (let i = 0; i < count; i++) {
        // Connect to 1-2 other nodes randomly
        const numEdges = Math.floor(Math.random() * 2);
        for (let j = 0; j < numEdges; j++) {
            const targetId = `node-${Math.floor(Math.random() * count)}`;
            if (nodes[i].id !== targetId) {
                edges.push({
                    source: nodes[i].id,
                    target: targetId
                });
            }
        }
    }

    return { nodes, edges };
}
