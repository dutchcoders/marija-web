import {Node} from "../modules/graph/interfaces/node";

export default function markHighlightedNodes(nodes: Node[], toHighlight: Node[]): Node[] {
    nodes = nodes.concat([]);
    const ids = toHighlight.map(node => node.id);

    nodes.forEach((node, index) => {
        const shouldHighlight = ids.indexOf(node.id) !== -1;

        if (shouldHighlight && !node.highlighted) {
            // Add new highlight
            nodes[index] = Object.assign({}, node, {
                highlighted: true
            });
        } else if (!shouldHighlight && node.highlighted) {
            // Remove previous highlight
            nodes[index] = Object.assign({}, node, {
                highlighted: false
            });
        }
    });

    return nodes;
}