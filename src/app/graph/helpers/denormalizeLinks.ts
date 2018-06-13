import { Link } from '../interfaces/link';
import { Normalization } from '../interfaces/normalization';

export default function denormalizeLinks(links: Link[], deleted: Normalization): Link[] {
    // Remove normalization parent
    links = links.filter(link =>
        !(link.isNormalizationParent && link.normalizationIds.indexOf(deleted.id) !== -1)
    );

    // Delete references to parent that no longer exists
    links = links.map(link => {
        if (link.normalizationIds.indexOf(deleted.id) !== -1) {
            return {
                ...link,
                normalizationIds: link.normalizationIds.filter(id => id !== deleted.id)
            };
        }

        return link;
    });

    return links;
}
