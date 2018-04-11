import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";

export default function denormalizeLinks(links: Link[], deleted: Normalization): Link[] {
    // Remove normalization parent
    links = links.filter(link =>
        !(link.isNormalizationParent && link.normalizationId === deleted.id)
    );

    // Delete references to parent that no longer exists
    links = links.map(link => {
        if (link.normalizationId === deleted.id) {
            return Object.assign({}, link, {
                normalizationId: null
            });
        }

        return link;
    });

    return links;
}
