import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";

export default function displayFilter(item: Node|Link): boolean {
    return item.display
        && (item.isNormalizationParent || item.normalizationId === null);
}