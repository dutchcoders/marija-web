import { concat, pull, slice, without } from 'lodash';

import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';
import removeDeadLinks from './removeDeadLinks';

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
    links = removeDeadLinks(nodes, links);

    return {
        nodes,
        links
    };
}