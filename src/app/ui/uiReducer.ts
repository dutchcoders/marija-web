import {
    CLOSE_PANE,
    MOVE_PANE_TO_TOP,
    OPEN_PANE,
    SET_PANE_CONFIG
} from "./uiConstants";
import {each} from 'lodash';

export interface PaneInterface {
    open: boolean;
    width: number;
    height: number;
    x: number;
    y: number;
    fullHeight: boolean;
    fullWidth: boolean;
    alignRight: boolean;
    alignBottom: boolean;
    minWidth: number;
    minHeight: number;
    zIndex: number;
}

export interface UiState {
    panes: {
        [name: string]: PaneInterface
    }
}

const defaultPane: PaneInterface = {
    open: false,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    fullHeight: false,
    fullWidth: false,
    alignRight: false,
    alignBottom: false,
    minWidth: 200,
    minHeight: 100,
    zIndex: 2
};

export const defaultUiState: UiState = {
    panes: {
        configuration: {
            ...defaultPane,
            open: true,
            width: 400,
            fullHeight: true,
            minWidth: 300
        },
        nodes: {
            ...defaultPane,
            width: 350,
            height: 300,
            alignRight: true,
            minWidth: 300
        },
        table: {
            ...defaultPane,
            width: 500,
            height: 400,
            y: 300,
            alignRight: true,
            alignBottom: true,
            minWidth: 430
        },
        timeline: {
            ...defaultPane,
            width: 300,
            height: 300,
            alignBottom: true,
            fullWidth: true
        },
        filter: {
            ...defaultPane,
            width: 300,
            height: 300,
        },
        chordDiagram: {
            ...defaultPane,
            width: 500,
            height: 500,
        }
    }
};

export default function uiReducer(state: UiState = defaultUiState, action): UiState {

    switch (action.type) {
        case OPEN_PANE: {
            const pane = Object.assign({}, state.panes[action.pane]);
            pane.open = true;

            return Object.assign({}, state, {
                panes: {
                    ...state.panes,
                    [action.pane]: pane
                }
            });
        }
        case CLOSE_PANE: {
            const pane = Object.assign({}, state.panes[action.pane]);
            pane.open = false;

            return Object.assign({}, state, {
                panes: {
                    ...state.panes,
                    [action.pane]: pane
                }
            });
        }
        case SET_PANE_CONFIG: {
            const pane = Object.assign({}, state.panes[action.key], action.config);

            return Object.assign({}, state, {
                panes: {
                    ...state.panes,
                    [action.key]: pane
                }
            });
        }
        case MOVE_PANE_TO_TOP: {
            let highestZIndex = 0;

            each(state.panes, pane => {
                highestZIndex = Math.max(highestZIndex, pane.zIndex);
            });

            const pane = Object.assign({}, state.panes[action.key]);
            pane.zIndex = highestZIndex + 1;

            return Object.assign({}, state, {
                panes: {
                    ...state.panes,
                    [action.key]: pane
                }
            });
        }
        default:
            return state;
    }
}