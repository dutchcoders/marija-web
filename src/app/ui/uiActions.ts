import {
	CLOSE_LIGHTBOX,
	CLOSE_PANE, CREATE_WORKSPACE,
	MOVE_PANE_TO_TOP, OPEN_LIGHTBOX,
	OPEN_PANE, RECEIVE_WORKSPACE, REQUEST_WORKSPACE, SET_EXPERIMENTAL_FEATURES,
	SET_PANE_CONFIG, SET_REDUCER_ERROR, UPDATE_WORKSPACE, WORKSPACE_CREATED
} from './uiConstants';
import { webSocketSend } from '../connection/connectionActions';
import { AppState } from '../main/interfaces/appState';
import { Workspace } from './interfaces/workspace';
import Url from '../main/helpers/url';
import { uniqueId } from 'lodash';
import { Field } from '../fields/interfaces/field';

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

const workspaceVersion: number = 4;

function getWorkspace(state: AppState): Workspace {
	// Only save the fields of custom datasources, we get the other fields from the server
	const customDatasourceIds = state.datasources.datasources
		.filter(datasource => datasource.isCustom)
		.map(datasource => datasource.id);

	const customFields: Field[] = state.fields.availableFields
		.filter(field => customDatasourceIds.indexOf(field.datasourceId) !== -1);

	return {
		version: workspaceVersion,
		panes: state.ui.panes,
		datasources: state.datasources.datasources,
		filterBoringNodes: state.graph.filterBoringNodes,
		filterSecondaryQueries: state.graph.filterSecondaryQueries,
		connectors: state.fields.connectors,
		availableFields: customFields,
		experimentalFeatures: state.ui.experimentalFeatures,
		queryHistory: state.graph.queryHistory
	};
}

function getLocalStorageKey(id: string) {
	return 'workspace_' + id;
}

export function workspaceCreated(id: string) {
	Url.setWorkspaceId(id);

	return {
		type: WORKSPACE_CREATED,
		payload: {
			id
		}
	};
}

export function updateWorkspace() {
	return (dispatch, getState) => {
		const state: AppState = getState();

		const id = Url.getWorkspaceId();
		const workspace = getWorkspace(state);

		if (id) {
			// dispatch(webSocketSend({
			// 	type: UPDATE_WORKSPACE,
			// 	id: state.ui.workspaceId,
			// 	workspace: workspace
			// }));

			// Temporary: save workspace in local storage, until the backend is finished
			localStorage.setItem(getLocalStorageKey(id), JSON.stringify(workspace));
		} else {
			// dispatch(webSocketSend({
			// 	type: CREATE_WORKSPACE,
			// 	workspace: workspace
			// }));

			// Temporary: save workspace in local storage, until the backend is finished
			const newId = uniqueId();

			localStorage.setItem(getLocalStorageKey(newId), JSON.stringify(workspace));
			dispatch(workspaceCreated(newId));
		}
	};
}

export function requestWorkspace(id: string) {
	return (dispatch, getState) => {
		dispatch(webSocketSend({
			type: REQUEST_WORKSPACE,
			id: id
		}));

		// Temporary: get workspace from local storage, until the backend is finished
		const workspace = localStorage.getItem(getLocalStorageKey(id));

		if (workspace) {
			dispatch(receiveWorkspace(id, JSON.parse(workspace)));
		}
	};
}

export function receiveWorkspace(id: string, workspace: Workspace) {
	return (dispatch, getState) => {
		if (workspace.version !== workspaceVersion) {
			// Workspace is outdated, do nothing
			console.error('Prevented loading an outdated workspace. Current version is ' + workspaceVersion + ', but loaded workspace was version ' + workspace.version);
			return;
		}

		dispatch({
			type: RECEIVE_WORKSPACE,
			payload: {
				id,
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

export function setReducerError(reducerError, reducerErrorState, reducerErrorLastAction) {
	return {
		type: SET_REDUCER_ERROR,
		payload: {
			reducerError,
			reducerErrorState,
			reducerErrorLastAction,
		}
	}
}