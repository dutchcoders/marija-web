import { NODES_DELETE, NODES_HIGHLIGHT, SELECTION_CLEAR } from './index';

export function deleteNodes(opts) {
    return {
        type: NODES_DELETE,
        receivedAt: Date.now(),
        nodes: opts
    };
}


export function highlightNodes(opts) {
    return {
        type: NODES_HIGHLIGHT,
        receivedAt: Date.now(),
        ...opts
    };
}


export function clearSelection(opts) {
    return {
        type: SELECTION_CLEAR,
        receivedAt: Date.now(),
        ...opts,
    };
}
