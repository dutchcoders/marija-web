import { uniqueId } from 'lodash';
import { cancelRequest, webSocketSend } from '../connection/connectionActions';
import { Datasource } from '../datasources/interfaces/datasource';
import { Node } from '../graph/interfaces/node';
import { Item } from '../items/interfaces/item';
import { AppState } from '../main/interfaces/appState';
import { Search } from './interfaces/search';
import { ACTIVATE_LIVE_DATASOURCE, ADD_LIVE_DATASOURCE_SEARCH, DEACTIVATE_LIVE_DATASOURCE, LIVE_RECEIVE, SEARCH_DELETE, SEARCH_EDIT, SEARCH_FIELDS_UPDATE, SEARCH_RECEIVE, SEARCH_REQUEST } from './searchConstants';
import { getGraphWorkerPayload } from '../graph/helpers/getGraphWorkerPayload';
import { getSelectedFields } from '../fields/fieldsSelectors';
import { getItemByNode } from '../graph/helpers/getItemByNode';
import Url from '../main/helpers/url';
import { DEFAULT_DISPLAY_NODES_PER_SEARCH } from '../graph/graphConstants';
import { setExpectedGraphWorkerOutputId } from '../graph/graphActions';

export function searchRequest(query: string, datasourceIds?: string[]) {
    return (dispatch, getState) => {
        const state: AppState = getState();
        const fields = getSelectedFields(state);
        const fieldPaths: string[] = fields.map(field => field.path);

        if (!datasourceIds) {
        	datasourceIds = state.datasources.datasources
				.filter(datasource => datasource.active)
				.map(datasource => datasource.id);
		}

        const requestId = uniqueId();

        dispatch(webSocketSend({
            type: SEARCH_REQUEST,
            datasources: datasourceIds,
            fields: fieldPaths,
            query: query,
            'request-id': requestId
        }));


		Url.addQuery(query);

        dispatch({
            type: SEARCH_REQUEST,
            receivedAt: Date.now(),
            query: query,
            aroundNodeId: null,
            displayNodes: DEFAULT_DISPLAY_NODES_PER_SEARCH,
            datasourceIds: datasourceIds,
            requestId: requestId
        });
    };
}

export function searchAround(node: Node) {
    return (dispatch, getState) => {
        const state: AppState = getState();

        const datasourceIds = state.datasources.datasources
			.filter(datasource => datasource.active && datasource.type !== 'live')
			.map(datasource => datasource.id);

        let query: string;

        const fields = getSelectedFields(state)
			.filter(field => datasourceIds.indexOf(field.datasourceId) !== -1)
			.map(field => field.path);

        if (node.type === 'item') {
        	const item = getItemByNode(node, state.graph.items);
			const fieldPaths = Object.keys(item.fields);
			query = fieldPaths.reduce((query: string, fieldPath: string) => {
			    if (!item.fields[fieldPath]) {
			        return query;
                }

				return query + ' "' + item.fields[fieldPath] + '"';
			}, '');
		} else {
        	query = '"' + node.name + '"';
		}

		const requestId = uniqueId();

		dispatch(webSocketSend({
			type: SEARCH_REQUEST,
			datasources: datasourceIds,
			fields: fields,
			query: query,
			'request-id': requestId
		}));

		dispatch({
			type: SEARCH_REQUEST,
			receivedAt: Date.now(),
			query: query,
			aroundNodeId: node.id,
			displayNodes: DEFAULT_DISPLAY_NODES_PER_SEARCH,
			datasourceIds: datasourceIds,
			requestId: requestId
		});
    }
}

export function searchReceive(items: Item[], requestId: string) {
	return (dispatch, getState) => {
		dispatch(setExpectedGraphWorkerOutputId(uniqueId()));

        const state: AppState = getState();
        const search: Search = state.graph.searches.find((search: Search) =>
            search.requestId === requestId
        );

        if (!search) {
            // received items for a query we were not searching for
            return;
        }

        dispatch({
            type: SEARCH_RECEIVE,
            meta: {
                WebWorker: true
            },
            payload: getGraphWorkerPayload(state, items, search.searchId)
        });
    }
}

export function liveReceive(items: Item[], datasourceId: string) {
    return (dispatch, getState) => {
		dispatch(setExpectedGraphWorkerOutputId(uniqueId()));

		const state: AppState = getState();

		// Search id is the same as the datasource id for live_receive
		const searchId: string = datasourceId;

        dispatch({
            type: LIVE_RECEIVE,
            meta: {
                WebWorker: true
            },
            payload: getGraphWorkerPayload(state, items, searchId)
        });
    }
}

export function deleteSearch(search: Search) {
    return (dispatch, getState) => {
        dispatch({
            type: SEARCH_DELETE,
            receivedAt: Date.now(),
            payload: {
                search: search
            }
        });

        Url.removeQuery(search.q);

        if (!search.completed) {
            // Tell the server it can stop sending results for this query
            dispatch(cancelRequest(search.requestId));
        }
    };
}

export function editSearch(searchId: string, opts) {
    return {
        type: SEARCH_EDIT,
        receivedAt: Date.now(),
        searchId: searchId,
        opts: opts
    };
}

export function pauseSearch(search: Search) {
    return (dispatch, getState) => {
        dispatch({
            type: SEARCH_EDIT,
            receivedAt: Date.now(),
            searchId: search.searchId,
            opts: {
                paused: true
            }
        });

        dispatch(cancelRequest(search.requestId));
    };
}

export function addLiveDatasourceSearch(datasource: Datasource) {
    return {
        type: ADD_LIVE_DATASOURCE_SEARCH,
        payload: {
            datasource: datasource
        }
    };
}


export function activateLiveDatasource(datasourceId: string) {
    return {
        type: ACTIVATE_LIVE_DATASOURCE,
        payload: {
            datasourceId: datasourceId
        }
    };
}

export function deactivateLiveDatasource(datasourceId: string) {
    return {
        type: DEACTIVATE_LIVE_DATASOURCE,
        payload: {
            datasourceId: datasourceId
        }
    };
}

export function resumeSearch(search: Search) {
    return (dispatch, getState) => {
        const state: AppState = getState();
        const fields: string[] = getSelectedFields(state).map(field => field.path);
        const requestId = uniqueId();

        dispatch(webSocketSend({
            type: SEARCH_REQUEST,
            datasources: search.datasources,
            query: search.q,
            fields: fields,
            'request-id': requestId
        }));

        dispatch({
            type: SEARCH_EDIT,
            receivedAt: Date.now(),
            searchId: search.searchId,
            opts: {
                paused: false,
                requestId: requestId
            }
        });
    };
}