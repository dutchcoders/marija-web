import { slice, concat, without, pull } from 'lodash';
import {Node} from "../modules/graph/interfaces/node";
import {Link} from "../modules/graph/interfaces/link";

const removeNodes = (nodes: Node[], removedSearchId: string) => {
    nodes.forEach((node, index) => {
        // Remove this query from the list of searchIds that the node appeared for
        node.searchIds = without(node.searchIds, removedSearchId);

        // When there are no more searchIds where this node appeared for, we can remove the node
        if (node.searchIds.length === 0) {
            nodes = without(nodes, node);
        }
    });

    return nodes;
};

/**
 * Remove nodes by query
 *
 * @param previousNodes
 * @param previousLinks
 * @param removedSearchId
 * @returns {{nodes: ConcatArray<*>[], links: ConcatArray<*>[]}}
 */
export default function removeNodesAndLinks(previousNodes: Node[], previousLinks: Link[], removedSearchId: string) {
    let nodes = concat(previousNodes, []);
    let links = concat(previousLinks, []);

    nodes = removeNodes(nodes, removedSearchId);

    // todo: use removeDeadLinks function instead

    links.forEach(link => {
        const sourceNode = nodes.find(node => node.name === link.source);
        const targetNode = nodes.find(node => node.name === link.target);

        // Remove the link when either the source or the target node no longer exists
        if (!sourceNode || !targetNode) {
            links = without(links, link);
        }
    });

    return {
        nodes,
        links
    };
}