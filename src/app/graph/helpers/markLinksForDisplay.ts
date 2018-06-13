import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';

/**
 * Sets the property display of the links to true or false.
 *
 * @param {Node[]} nodes
 * @param {Link[]} links
 * @returns {Link[]}
 */
export default function markLinksForDisplay(nodes: Node[], links: Link[]): Link[] {
    const linksForDisplay: Link[] = [];
    const nodeMap = new Map<number, true>();

    nodes.forEach(node => {
        if (node.display) {
            nodeMap.set(node.id, true);
        }
    });

    links.forEach(link => {
        const display: boolean = nodeMap.has(link.source) && nodeMap.has(link.target);

        const newLink: Link = Object.assign({}, link, {
            display: display
        });

        linksForDisplay.push(newLink);
    });

    return linksForDisplay;
}