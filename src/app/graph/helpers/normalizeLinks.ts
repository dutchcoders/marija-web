import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import { Node } from '../interfaces/node';
import { union } from 'lodash';

export default function normalizeLinks(
    nodes: Node[],
    links: Link[],
    normalizations: Normalization[]
): Link[] {
    if (normalizations.length === 0) {
        return links;
    }

    const nodeMap = new Map<number, Node>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    const nodeParentsMap = new Map<string, number>();
    nodes.filter(node => node.isNormalizationParent)
        .forEach(node => nodeParentsMap.set(node.normalizationId, node.id));

    let newLinks: Link[] = [];

    links.forEach(link => {
        if (link.normalizationIds.length) {
            newLinks.push(link);
            return;
        }

		const source: Node = nodeMap.get(link.source);
        const target: Node = nodeMap.get(link.target);

        let newTarget: number = link.target;
        let newSource: number = link.source;

        if (target.normalizationId && !target.isNormalizationParent) {
            link = {
                ...link,
                normalizationIds: link.normalizationIds.concat([target.normalizationId])
            };

			newTarget = nodeParentsMap.get(target.normalizationId);
        }

        if (source.normalizationId && !source.isNormalizationParent) {
			link = {
				...link,
				normalizationIds: link.normalizationIds.concat([source.normalizationId])
			};

			newSource = nodeParentsMap.get(source.normalizationId);
		}

		const propertyChanged: boolean = newTarget !== link.target || newSource !== link.source;
        const wouldLinkToSelf: boolean = newTarget === newSource;

		if (propertyChanged && !wouldLinkToSelf) {
            const parent = {
                ...link,
                isNormalizationParent: true,
                source: newSource,
                target: newTarget,
                hash: newSource + newTarget
            };

            const existingParent = newLinks.find(link =>
                link.hash === parent.hash
            );

            if (existingParent) {
			    existingParent.normalizationIds = union(existingParent.normalizationIds, parent.normalizationIds);
			} else {
				newLinks.push(parent);
            }
        }

		newLinks.push(link);
    });

    return newLinks;
}