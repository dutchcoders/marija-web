import {
	CLOSE_LIGHTBOX,
	CLOSE_PANE,
	CURRENT_WORKSPACE_VERSION, EDIT_WORKSPACE_TITLE,
	MOVE_PANE_TO_TOP,
	OPEN_LIGHTBOX,
	OPEN_PANE,
	RECEIVE_WORKSPACE, RECEIVE_WORKSPACE_DESCRIPTIONS,
	REQUEST_WORKSPACE,
	SET_EXPERIMENTAL_FEATURES,
	SET_LANG,
	SET_PANE_CONFIG,
	SET_REDUCER_ERROR
} from './uiConstants';
import { webSocketSend } from '../connection/connectionActions';
import { AppState } from '../main/interfaces/appState';
import { Workspace, WorkspaceDescription } from './interfaces/workspace';
import Url from '../main/helpers/url';
import { uniqueId } from 'lodash';
import { Field } from '../fields/interfaces/field';
import { Language } from './interfaces/uiState';
import { selectActiveWorkspaceDescription } from './uiSelectors';

export function openPane(pane) {
    return {
        type: OPEN_PANE,
        pane: pane
    };
}

export function closePane(pane) {
    return {
        type: CLOSE_PANE,
        pane: pane
    };
}

export function setPaneConfig(key, config) {
    return {
        type: SET_PANE_CONFIG,
        key: key,
        config: config
    };
}

export function movePaneToTop(key) {
    return {
        type: MOVE_PANE_TO_TOP,
        key: key
    };
}

export function openLightbox(imageUrl: string) {
    return {
        type: OPEN_LIGHTBOX,
        payload: {
            imageUrl
        }
    };
}

export function closeLightbox() {
    return {
        type: CLOSE_LIGHTBOX
    };
}

function getWorkspace(state: AppState): Workspace {
	// Only save the fields of custom datasources, we get the other fields from the server
	const customDatasourceIds = state.datasources.datasources
		.filter(datasource => datasource.isCustom)
		.map(datasource => datasource.id);

	const customFields: Field[] = state.fields.availableFields
		.filter(field => customDatasourceIds.indexOf(field.datasourceId) !== -1);

	return {
		version: CURRENT_WORKSPACE_VERSION,
		panes: state.ui.panes,
		datasources: state.datasources.datasources,
		filterBoringNodes: state.graph.filterBoringNodes,
		filterSecondaryQueries: state.graph.filterSecondaryQueries,
		connectors: state.fields.connectors,
		experimentalFeatures: state.ui.experimentalFeatures,
		queryHistory: state.graph.queryHistory,
		columns: state.table.columns,
		sortColumn: state.table.sortColumn,
		sortType: state.table.sortType,
		lang: state.ui.lang,
		automaticallyCreateConnectors: state.graph.automaticallyCreateConnectors,
		customDatasourceFields: customFields
	};
}

function getLocalStorageKey(id: string) {
	return 'workspace_' + id;
}


export function saveWorkspaceInLocalStorage() {
	return (dispatch, getState) => {
		const state: AppState = getState();
		const workspace = getWorkspace(state);

		localStorage.setItem(getLocalStorageKey(state.ui.workspaceId), JSON.stringify(workspace));
	};
}

export function saveWorkspaceOnServer() {
	return (dispatch, getState) => {
		const state: AppState = getState();
		const workspace = getWorkspace(state);
		const workspaceDescription = selectActiveWorkspaceDescription(state);
		const merged = Object.assign({}, workspace, workspaceDescription);

		dispatch(webSocketSend({
			type: 'UPDATE_WORKSPACE',
			workspace: merged
		}));
	}
}

export function requestWorkspace(id: string) {
	return (dispatch, getState) => {
		dispatch({
			type: REQUEST_WORKSPACE
		});

		// Temporary: get workspace from local storage, until the backend is finished
		const workspace = localStorage.getItem(getLocalStorageKey(id));

		if (workspace) {
			console.log('Found workspace ', id, ' in local storage');

			// If we find it in the local storage, use that
			dispatch(receiveWorkspace(id, JSON.parse(workspace)));
			return;
		}


		if (id === '0') {
			// If the id is '0' and it was not found in local storage, just
			// use the current workspace
			dispatch(receiveWorkspace(id, getWorkspace(getState())));
			return;
		}

		// When it's not available in local storage, request it from the server
		console.log('Requesting workspace ', id, ' from server');

		dispatch(webSocketSend({
			type: REQUEST_WORKSPACE,
			id: id
		}));
	};
}

export function receiveWorkspace(workspaceId: string, workspace: Workspace) {
	return (dispatch, getState) => {
		if (workspace.version !== CURRENT_WORKSPACE_VERSION) {
			// Workspace is outdated, do nothing
			console.error('Prevented loading an outdated workspace. Current version is ' + CURRENT_WORKSPACE_VERSION + ', but loaded workspace was version ' + workspace.version);
			return;
		}

		Url.setWorkspaceId(workspaceId);

		dispatch({
			type: RECEIVE_WORKSPACE,
			payload: {
				workspaceId,
				workspace
			}
		});
	};
}

export function setExperimentalFeatures(enabled: boolean) {
	return {
		type: SET_EXPERIMENTAL_FEATURES,
		payload: {
			enabled
		}
	};
}

export function setReducerError(reducerError, reducerErrorLastAction) {
	return {
		type: SET_REDUCER_ERROR,
		payload: {
			reducerError,
			reducerErrorLastAction,
		}
	}
}

export function setLang(lang: Language) {
	return {
		type: SET_LANG,
		payload: {
			lang
		}
	};
}

export function receiveWorkspaceDescriptions(workspaceDescriptions: WorkspaceDescription[]) {
	return {
		type: RECEIVE_WORKSPACE_DESCRIPTIONS,
		payload: {
			workspaceDescriptions
		}
	};
}

export function editWorkspaceTitle(workspaceId: string, title: string) {
	return {
		type: EDIT_WORKSPACE_TITLE,
		payload: {
			workspaceId,
			title
		}
	};
}