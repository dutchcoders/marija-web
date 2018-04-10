import {Node} from "../modules/graph/interfaces/node";
import {Normalization} from "../modules/graph/interfaces/normalization";

export default function denormalizeNodes(nodes: Node[], deleted: Normalization): Node[] {
    // Remove normalization parent
    nodes = nodes.filter(node =>
        !(node.isNormalizationParent && node.normalizationId === deleted.id)
    );

    // Delete references to parent that no longer exists
    nodes = nodes.map(node => {
        if (node.normalizationId === deleted.id) {
            return Object.assign({}, node, {
                normalizationId: null
            });
        }

        return node;
    });

    return nodes;
}