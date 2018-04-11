import { Node } from '../interfaces/node';

export function deselectNodes(nodesToSelect: Node[], allNodes: Node[]): Node[] {
    const nodes: Node[] = allNodes.concat([]);

    nodesToSelect.forEach(node => {
        const index = nodes.findIndex(search =>
            search.id === node.id
            && search.display
            && (search.normalizationId === null || search.isNormalizationParent)
        );

        if (nodes[index].selected) {
            nodes[index] = Object.assign({}, nodes[index], {
                selected: false
            });
        }
    });

    return nodes;
}