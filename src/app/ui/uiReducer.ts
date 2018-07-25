import {each} from 'lodash';

import {
	CLOSE_LIGHTBOX,
	CLOSE_PANE,
	MOVE_PANE_TO_TOP, OPEN_LIGHTBOX,
	OPEN_PANE, RECEIVE_WORKSPACE, SET_EXPERIMENTAL_FEATURES,
	SET_PANE_CONFIG, WORKSPACE_CREATED
} from './uiConstants';
import {UiState} from "./interfaces/uiState";
import {PaneInterface} from "./interfaces/paneInterface";
import { Workspace } from './interfaces/workspace';

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
    zIndex: 3,
};

export const defaultUiState: UiState = {
    experimentalFeatures: false,
    workspaceId: null,
    panes: {
        configuration: {
            ...defaultPane,
            open: false,
            width: 400,
            fullHeight: true,
            minWidth: 300
        },
        nodes: {
            ...defaultPane,
            width: 550,
            height: 500,
			y: 55,
            alignRight: true,
            minWidth: 300
        },
        table: {
            ...defaultPane,
            width: 500,
            fullHeight: true,
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
        },
        adjacencyMatrix: {
            ...defaultPane,
            width: 500,
            height: 500,
        },
		valueTable: {
			...defaultPane,
			width: 500,
			fullHeight: true,
			alignRight: true
		}
    },
	lightboxImageUrl: null
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

        case OPEN_LIGHTBOX: {
            return {
                ...state,
                lightboxImageUrl: action.payload.imageUrl
            };
        }

        case CLOSE_LIGHTBOX: {
            return {
                ...state,
                lightboxImageUrl: null
            };
        }

        case WORKSPACE_CREATED: {
            return {
                ...state,
                workspaceId: action.payload.id
            };
        }

        case RECEIVE_WORKSPACE: {
			const workspace: Workspace = action.payload.workspace;

            return {
                ...state,
                panes: workspace.panes,
				experimentalFeatures: workspace.experimentalFeatures
            };
        }

		case SET_EXPERIMENTAL_FEATURES: {
			return {
				...state,
				experimentalFeatures: action.payload.enabled
			}
		}

        default:
            return state;
    }
}