import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";

export default function normalizeLinks(
    links: Link[],
    normalizations: Normalization[]
): Link[] {
    if (normalizations.length === 0) {
        return links;
    }

    const regexes = normalizations.map(normalization => new RegExp(normalization.regex, 'i'));
    const parents = links.filter(link => link.isNormalizationParent);
    let children = links.filter(link => !link.isNormalizationParent);

    const exists = (source, target): boolean => {
        const link = parents.find(search =>
            (search.source === source && search.target === target)
            || (search.source === target && search.target === source)
        );

        return typeof link !== 'undefined';
    };

    children = children.map(link => {
        const updates: any = {};

        normalizations.forEach((normalization, nIndex) => {
            const check = (property: 'source' | 'target', oppositeProperty: 'source' | 'target') => {
                if (regexes[nIndex].test(link[property])) {
                    updates.normalizationId = normalization.id;

                    const wouldLinkToSelf: boolean =
                        link[oppositeProperty] === normalization.replaceWith
                        || regexes[nIndex].test(link[oppositeProperty]);

                    if (!wouldLinkToSelf && !exists(link[oppositeProperty], normalization.replaceWith)) {
                        const parentLink: Link = Object.assign({}, link, {
                            [property]: normalization.replaceWith,
                            isNormalizationParent: true,
                            normalizationId: normalization.id
                        });

                        parents.push(parentLink);
                    }
                }
            };

            check('source', 'target');
            check('target', 'source');
        });

        if (updates) {
            return Object.assign({}, link, updates);
        }

        return link;
    });

    return children.concat(parents);
}