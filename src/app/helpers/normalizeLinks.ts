import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";

export default function normalizeLinks(
    links: Link[],
    normalizations: Normalization[]
): {
    links: Link[],
    normalizations: Normalization[]
} {
    if (normalizations.length === 0) {
        return {
            links,
            normalizations
        };
    }

    links = links.concat([]);
    normalizations = normalizations.concat([]);

    const exists = (source, target): boolean => {
        const link = links.find(search =>
            typeof search !== 'undefined'
            && (
                search.source === source && search.target === target
                || search.source === target && search.target === source
            )
        );

        return typeof link !== 'undefined';
    };

    const regexes = normalizations.map(normalization => new RegExp(normalization.regex, 'i'));

    links.forEach((link, index) => {
        normalizations.forEach((normalization, nIndex) => {
            const check = (property: 'source' | 'target', oppositeProperty: 'source' | 'target') => {
                if (regexes[nIndex].test(link[property]) && link[property] !== normalization.replaceWith) {
                    const wouldLinkToSelf: boolean = link[oppositeProperty] === normalization.replaceWith;

                    if (wouldLinkToSelf || exists(link[oppositeProperty], normalization.replaceWith) || regexes[nIndex].test(link[oppositeProperty])) {
                        delete links[index];
                    } else {
                        // Update if source and target are different
                        links[index] = Object.assign({}, link, {
                            [property]: normalization.replaceWith,
                            normalized: true
                        });
                    }

                    // Store as an 'affected link', in case we might want to undo the
                    // normalization later
                    normalizations[nIndex] = Object.assign({}, normalization, {
                        affectedLinks: normalization.affectedLinks.concat([link])
                    });
                }
            };

            check('source', 'target');
            check('target', 'source');
        });
    });

    links = links.filter(link => typeof link !== 'undefined');

    return {
        links,
        normalizations
    }
}