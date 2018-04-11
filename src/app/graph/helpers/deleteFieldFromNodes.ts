import {Node} from "../interfaces/node";

export default function deleteFieldFromNodes(fieldPath: string, nodes: Node[]) {
    nodes = nodes.concat([]);

    nodes.forEach((node, key) => {
        if (node.fields.indexOf(fieldPath) === -1) {
            return;
        }

        nodes[key] = Object.assign({}, node, {
            fields: node.fields.filter(fieldLoop => fieldPath !== fieldLoop)
        });
    });

    return nodes.filter(node => node.fields.length > 0);
}