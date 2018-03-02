import {Node} from "../../interfaces/node";
import {HIDE_CONTEXT_MENU, SHOW_CONTEXT_MENU} from "./contextMenuConstants";

interface State {
    node: Node;
    x: number;
    y: number;
}

export const initialContextMenuState: State = {
    node: undefined,
    x: undefined,
    y: undefined
};

export default function contextMenuReducer(state: State = initialContextMenuState, action) {
    switch (action.type) {
        case SHOW_CONTEXT_MENU: {
            return Object.assign({}, state, {
                node: action.node,
                x: action.x,
                y: action.y
            });
        }
        case HIDE_CONTEXT_MENU: {
            return Object.assign({}, state, {
                node: undefined,
                x: undefined,
                y: undefined
            });
        }
        default: {
            return state;
        }
    }
}