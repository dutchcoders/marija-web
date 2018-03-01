import {Node} from "../../interfaces/node";
import {HIDE_CONTEXT_MENU, SHOW_CONTEXT_MENU} from "./contextMenuConstants";

export function showContextMenu(node: Node, x: number, y: number) {
    return {
        type: SHOW_CONTEXT_MENU,
        node: node,
        x: x,
        y: y
    };
}

export function hideContextMenu() {
    return {
        type: HIDE_CONTEXT_MENU
    };
}