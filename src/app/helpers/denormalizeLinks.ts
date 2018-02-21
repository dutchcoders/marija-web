import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";

export default function denormalizeLinks(links: Link[], deleted: Normalization): Link[] {
    links = links.filter((link, index) => {
        return link.normalizationId !== deleted.id;
    });

    links = links.concat(deleted.affectedLinks);

    return links;
}