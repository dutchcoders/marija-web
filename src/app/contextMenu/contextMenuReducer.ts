import {HIDE_CONTEXT_MENU, SHOW_CONTEXT_MENU} from './contextMenuConstants';
import {ContextMenuState} from "./interfaces/contextMenuState";

export const defaultContextMenuState: ContextMenuState = {
    nodeId: undefined,
    x: undefined,
    y: undefined
};

export default function contextMenuReducer(state: ContextMenuState = defaultContextMenuState, action): ContextMenuState {
    switch (action.type) {
        case SHOW_CONTEXT_MENU: {
            return {
                ...state,
                nodeId: action.payload.nodeId,
                x: action.payload.x,
                y: action.payload.y
            };
        }

        case HIDE_CONTEXT_MENU: {
            return {
                ...state,
                nodeId: undefined,
                x: undefined,
                y: undefined
            };
        }

        default: {
            return state;
        }
    }
}