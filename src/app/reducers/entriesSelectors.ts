import { createSelector } from 'reselect';

export const getNodesForDisplay = createSelector(
    (state: any) => state.entries.nodes,
    (nodes) => nodes.filter(node => node.display)
);

export const getLinksForDisplay = createSelector(
    (state: any) => state.entries.links,
    (links) => links.filter(link => link.display)
);

export const getSelectedNodes = createSelector(
    (state: any) => state.entries.nodes,
    (nodes) => nodes.filter(node => node.selected)
);