import { Node } from '../interfaces/node';
import { Normalization } from '../interfaces/normalization';
import { getNumericHash } from './getNumericHash';

export default function normalizeNodes(
    nodes: Node[],
    normalizations: Normalization[]
): Node[] {
    if (normalizations.length === 0) {
        return nodes;
    }

    nodes = nodes.concat([]);
    normalizations = normalizations.concat([]);

    const regexes = normalizations.map(normalization => new RegExp(normalization.regex, 'i'));
    const parents: Node[] = nodes.filter(node => node.isNormalizationParent);
    let children: Node[] = nodes.filter(node => !node.isNormalizationParent);

    children = children.map(node => {
        const updates: any = {};

        normalizations.forEach((normalization, nIndex) => {
            if (regexes[nIndex].test(node.name)) {
                const parent: Node = parents.find(node =>
                    node.normalizationId === normalization.id
                );

                if (typeof parent === 'undefined') {
                    const newParent: Node = Object.assign({}, node, {
                        id: getNumericHash(normalization.replaceWith),
                        name: normalization.replaceWith,
                        abbreviated: normalization.replaceWith,
                        normalizationId: normalization.id,
                        isNormalizationParent: true,
                        selected: true
                    });

                    parents.push(newParent);
                }

                updates.normalizationId = normalization.id;
                updates.selected = false;
            }
        });

        if (updates) {
            return Object.assign({}, node, updates);
        }

        return node;
    });

    return children.concat(parents);
}