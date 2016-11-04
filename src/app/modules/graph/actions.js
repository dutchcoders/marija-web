import { DELETE_NODES, HIGHLIGHT_NODES, CLEAR_SELECTION } from './index';

export function deleteNodes(opts) {
    return {
        type: DELETE_NODES,
        receivedAt: Date.now(),
        nodes: opts
    };
}


export function highlightNodes(opts) {
    return {
        type: HIGHLIGHT_NODES,
        receivedAt: Date.now(),
        ...opts
    };
}


export function clearSelection(opts) {
    return {
        type: CLEAR_SELECTION,
        receivedAt: Date.now(),
        ...opts,
    };
}
