import { createSelector } from 'reselect';
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {AppState} from "../interfaces/appState";

/**
 * Returns a collection of nodes or links that are meant to be displayed on the
 * graph.
 *
 * @param {Array<Node | Link>} collection
 * @returns {Array<Node | Link>}
 */
const displayFilter = (collection: Array<Node|Link>): Array<Node|Link> => {
    return collection.filter(item =>
        item.display
        && (item.normalizationId === null || item.isNormalizationParent)
    );
};

export const getNodesForDisplay = createSelector(
    (state: AppState) => state.entries.nodes,
    (nodes: Node[]) => displayFilter(nodes) as Node[]
);

export const getLinksForDisplay = createSelector(
    (state: AppState) => state.entries.links,
    (links: Link[]) => displayFilter(links) as Link[]
);

export const getSelectedNodes = createSelector(
    (state: AppState) => state.entries.nodes,
    (nodes) => nodes.filter(node => node.selected)
);