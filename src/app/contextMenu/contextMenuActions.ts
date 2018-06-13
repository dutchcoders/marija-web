import { HIDE_CONTEXT_MENU, SHOW_CONTEXT_MENU } from './contextMenuConstants';

export function showContextMenu(nodeId: number, x: number, y: number) {
    return {
        type: SHOW_CONTEXT_MENU,
        payload: {
            nodeId: nodeId,
            x: x,
            y: y
        }
    };
}

export function hideContextMenu() {
    return {
        type: HIDE_CONTEXT_MENU
    };
}