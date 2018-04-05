import {HIDE_CONTEXT_MENU, SHOW_CONTEXT_MENU} from "./contextMenuConstants";

export interface ContextMenuState {
    nodeId: string;
    x: number;
    y: number;
}

export const initialContextMenuState: ContextMenuState = {
    nodeId: undefined,
    x: undefined,
    y: undefined
};

export default function contextMenuReducer(state: ContextMenuState = initialContextMenuState, action): ContextMenuState {
    switch (action.type) {
        case SHOW_CONTEXT_MENU: {
            return Object.assign({}, state, {
                nodeId: action.nodeId,
                x: action.x,
                y: action.y
            });
        }
        case HIDE_CONTEXT_MENU: {
            return Object.assign({}, state, {
                nodeId: undefined,
                x: undefined,
                y: undefined
            });
        }
        default: {
            return state;
        }
    }
}