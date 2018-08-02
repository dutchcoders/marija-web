import { Node } from '../interfaces/node';

export function selectNodes(nodesToSelect: Node[], allNodes: Node[]): Node[] {
    const nodes: Node[] = allNodes.concat([]);

    nodesToSelect.forEach(node => {
        const index = nodes.findIndex(searchNode =>
            searchNode.id === node.id
        );

        if (index === -1) {
            throw new Error('Node ' + node.id + ' not found');
        }

        if (!nodes[index].selected) {
            nodes[index] = Object.assign({}, nodes[index], {
                selected: true
            });
        }
    });

    return nodes;
}