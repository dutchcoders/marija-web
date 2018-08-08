import {each} from 'lodash';

import {
	CLOSE_LIGHTBOX,
	CLOSE_PANE, CURRENT_WORKSPACE_VERSION, EDIT_WORKSPACE_TITLE,
	MOVE_PANE_TO_TOP,
	OPEN_LIGHTBOX,
	OPEN_PANE,
	RECEIVE_WORKSPACE,
	RECEIVE_WORKSPACE_DESCRIPTIONS, REQUEST_WORKSPACE,
	SET_EXPERIMENTAL_FEATURES,
	SET_LANG,
	SET_PANE_CONFIG,
	SET_REDUCER_ERROR
} from './uiConstants';
import { Language, UiState } from "./interfaces/uiState";
import {PaneInterface} from "./interfaces/paneInterface";
import { Workspace, WorkspaceDescription } from './interfaces/workspace';

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
    workspaceId: '0',
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
	lightboxImageUrl: null,
	reducerError: null,
    reducerErrorLastAction: null,
    lang: 'en',
    workspaceDescriptions: [{
		id: '0',
		title: 'Untitled',
		version: CURRENT_WORKSPACE_VERSION
	}],
	isRequestingWorkspace: false
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

        case RECEIVE_WORKSPACE: {
        	const workspaceId: string = action.payload.workspaceId;
			const workspace: Workspace = action.payload.workspace;

            return {
                ...state,
                panes: workspace.panes,
				experimentalFeatures: workspace.experimentalFeatures,
                lang: workspace.lang,
				workspaceId: workspaceId,
				isRequestingWorkspace: false
            };
        }

		case SET_EXPERIMENTAL_FEATURES: {
			return {
				...state,
				experimentalFeatures: action.payload.enabled
			}
		}

		case SET_REDUCER_ERROR: {
			return {
				...state,
				reducerError: action.payload.reducerError,
				reducerErrorLastAction: action.payload.reducerErrorLastAction
			};
		}

        case SET_LANG: {
            const lang: Language = action.payload.lang;

            return {
                ...state,
                lang
            }
        }

        case RECEIVE_WORKSPACE_DESCRIPTIONS: {

        	const workspaceDescriptions = state.workspaceDescriptions.concat(action.payload.workspaceDescriptions);

            return {
                ...state,
                workspaceDescriptions
            };
        }

		case EDIT_WORKSPACE_TITLE: {
			const workspaceId: string = action.payload.workspaceId;
			const title: string = action.payload.title;
			const workspaceDescriptions = state.workspaceDescriptions.concat([]);
			const index = workspaceDescriptions.findIndex(description => description.id === workspaceId);

			workspaceDescriptions[index] = {
				...workspaceDescriptions[index],
				title
			};

			return {
				...state,
				workspaceDescriptions
			};
		}

		case REQUEST_WORKSPACE: {
			return {
				...state,
				isRequestingWorkspace: true
			};
		}

        default:
            return state;
    }
}