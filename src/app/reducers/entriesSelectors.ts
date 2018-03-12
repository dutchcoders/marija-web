import { createSelector } from 'reselect';
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";

export const getNodesForDisplay = createSelector(
    (state: any) => state.entries.nodes,
    (nodes: Node[]) => nodes.filter(node => node.display && (node.normalizationId === null || node.isNormalizationParent))
);

export const getLinksForDisplay = createSelector(
    (state: any) => state.entries.links,
    (links: Link[]) => links.filter(link => link.display && (link.normalizationId === null || link.isNormalizationParent))
);

export const getSelectedNodes = createSelector(
    (state: any) => state.entries.nodes,
    (nodes) => nodes.filter(node => node.selected)
);