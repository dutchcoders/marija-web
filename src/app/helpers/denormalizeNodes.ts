import {Node} from "../interfaces/node";
import {Normalization} from "../interfaces/normalization";

export default function denormalizeNodes(nodes: Node[], deleted: Normalization): Node[] {
    nodes = nodes.filter((node, index) => {
        return node.normalizationId !== deleted.id;
    });

    nodes = nodes.concat(deleted.affectedNodes);

    return nodes;
}