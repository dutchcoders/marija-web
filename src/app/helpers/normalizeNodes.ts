import {Node} from "../interfaces/node";
import {Normalization} from "../interfaces/normalization";

export default function normalizeNodes(
    nodes: Node[],
    normalizations: Normalization[]
): {
    nodes: Node[],
    normalizations: Normalization[]
} {
    if (normalizations.length === 0) {
        return {
            nodes,
            normalizations
        };
    }

    nodes = nodes.concat([]);
    normalizations = normalizations.concat([]);

    const regexes = normalizations.map(normalization => new RegExp(normalization.regex, 'i'));

    nodes.forEach((node, index) => {
        normalizations.forEach((normalization, nIndex) => {
            if (node.id !== normalization.replaceWith && regexes[nIndex].test(node.id)) {
                normalizations[nIndex] = Object.assign({}, normalization, {
                    affectedNodes: normalization.affectedNodes.concat([node])
                });

                delete nodes[index];

                const existing: Node = nodes.find(node =>
                    typeof node !== 'undefined'
                    && node.id === normalization.replaceWith
                );

                if (typeof existing === 'undefined') {
                    const normalized: Node = Object.assign({}, node, {
                        id: normalization.replaceWith,
                        name: normalization.replaceWith,
                        abbreviated: normalization.replaceWith,
                        normalized: true
                    });

                    nodes.push(normalized);
                }
            }
        });
    });

    nodes = nodes.filter(node => typeof node !== 'undefined');

    return {
        nodes,
        normalizations
    }
}