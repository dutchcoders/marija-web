import { Node } from '../interfaces/node';
import { Link } from '../interfaces/link';

/**
 * Will mark links as highlighted when both their target and source node are
 * highlighted.
 *
 * @param {Node[]} nodes
 * @param {Link[]} links
 * @returns {Link[]}
 */
export function markHighlightedLinks(nodes: Node[], links: Link[]): Link[] {
	const highlightedNodes = new Map<number, true>();

	nodes.filter(node => node.highlightLevel !== null)
		.forEach(node => highlightedNodes.set(node.id, true));

	return links.map(link => {
		return {
			...link,
			highlighted: highlightedNodes.has(link.source) && highlightedNodes.has(link.target)
		}
	});
}