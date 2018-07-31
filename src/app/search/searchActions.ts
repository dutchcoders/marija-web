import { uniqueId } from 'lodash';
import {
	cancelRequest,
	requestCompleted,
	webSocketSend
} from '../connection/connectionActions';
import { Datasource } from '../datasources/interfaces/datasource';
import { Node } from '../graph/interfaces/node';
import { Item } from '../graph/interfaces/item';
import { AppState } from '../main/interfaces/appState';
import { Search } from './interfaces/search';
import {
	ACTIVATE_LIVE_DATASOURCE,
	ADD_LIVE_DATASOURCE_SEARCH,
	CONFIRM_ITEMS,
	DEACTIVATE_LIVE_DATASOURCE, DISMISS_ITEMS_TO_CONFIRM,
	ITEMS_NEED_CONFIRMATION,
	ITEMS_NEED_CONFIRMATION_THRESHOLD,
	LIVE_RECEIVE,
	SEARCH_DELETE,
	SEARCH_EDIT,
	SEARCH_FIELDS_UPDATE,
	SEARCH_RECEIVE,
	SEARCH_REQUEST
} from './searchConstants';
import { getGraphWorkerPayload } from '../graph/helpers/getGraphWorkerPayload';
import { getSelectedFields } from '../fields/fieldsSelectors';
import Url from '../main/helpers/url';
import {
	DEFAULT_DISPLAY_NODES_PER_SEARCH
} from '../graph/graphConstants';

interface AdvancedQuery {
	field: string;
	operator: '>=';
	value: string;
}

export function searchRequest(query: string, dateFilter: string = null) {
    return (dispatch, getState) => {
        const state: AppState = getState();
        const fields = getSelectedFields(state);
        const fieldPaths: string[] = fields.map(field => field.path);
		const requestId = uniqueId();

		const datasources = state.datasources.datasources
			.filter(datasource => datasource.active);

		Url.addQuery(query);

		dispatch({
			type: SEARCH_REQUEST,
			receivedAt: Date.now(),
			query: query,
			aroundNodeId: null,
			displayNodes: DEFAULT_DISPLAY_NODES_PER_SEARCH,
			datasourceIds: datasources.map(datasource => datasource.id),
			requestId: requestId
		});

		const clientSide = datasources.filter(datasource => datasource.isCustom);

		clientSide.forEach(datasource => {
			dispatch(searchCustomDatasource(query, datasource, requestId));
		});

		const serverSide = datasources.filter(datasource => !datasource.isCustom);

		if (serverSide.length > 0) {
			const advancedQuery: AdvancedQuery[] = [];

			if (dateFilter !== null) {
				serverSide.forEach(datasource => {
					if (datasource.dateFieldPath) {
						advancedQuery.push({
							field: datasource.dateFieldPath,
							value: dateFilter,
							operator: '>='
						});
					}
				})
			}

			dispatch(webSocketSend({
				type: SEARCH_REQUEST,
				datasources: serverSide.map(datasource => datasource.id),
				fields: fieldPaths,
				query: query,
				'request-id': requestId,
				advancedQuery: advancedQuery
			}));
		}
    };
}

export function searchAround(node: Node) {
    return (dispatch, getState) => {
        const state: AppState = getState();

        const datasourceIds = state.datasources.datasources
			.filter(datasource => datasource.active && datasource.type !== 'live')
			.map(datasource => datasource.id);

        const queryParts: string[] = [];
        const fields = Object.keys(node.childData);

        fields.forEach(field => {
        	node.childData[field].forEach(value => {
        		queryParts.push(value);
			});
		});

        const query = '"' + queryParts.join('" "') + '"';
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

export function searchReceive(items: Item[], requestId: string, hasConfirmed: boolean = false) {
	return (dispatch, getState) => {
        const state: AppState = getState();
        const search: Search = state.graph.searches.find((search: Search) =>
            search.requestId === requestId
        );

        if (!search) {
            // received items for a query we were not searching for
            return;
        }

		// Save per item for which query we received it (so we can keep track of where data came from)
		items.forEach(item => {
			item.searchId = search.searchId;
		});

        if (!hasConfirmed && items.length > ITEMS_NEED_CONFIRMATION_THRESHOLD) {
        	dispatch({
				type: ITEMS_NEED_CONFIRMATION,
				payload: {
					search,
					items
				}
			});
		} else {
			dispatch({
				type: SEARCH_RECEIVE,
				meta: {
					WebWorker: true
				},
				payload: getGraphWorkerPayload(state, items, search.searchId)
			});
		}
    }
}

export function liveReceive(items: Item[], datasourceId: string) {
    return (dispatch, getState) => {
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

export function confirmItems(search: Search) {
	return (dispatch, getState) => {
		dispatch({
			type: CONFIRM_ITEMS,
			payload: {
				search
			}
		});

		dispatch(searchReceive(search.itemsToConfirm, search.requestId, true));
	};
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

export function searchCustomDatasource(query: string, datasource: Datasource, requestId: string) {
	return (dispatch, getState) => {
		const matches = datasource.items.filter(item => {
			const keys = Object.keys(item.fields);

			for (let i = 0; i < keys.length; i ++) {
				const value: string = item.fields[keys[i]];

				if (value.toLowerCase().includes(query.toLowerCase())) {
					return true;
				}
			}

			return false;
		});

		if (matches.length > 0) {
			dispatch(searchReceive(matches, requestId));
		}

		dispatch(requestCompleted(requestId));
	};
}

export function showAllItemsOfCustomDatasource(datasource: Datasource) {
	return (dispatch, getState) => {
		const requestId = uniqueId();

		dispatch({
			type: SEARCH_REQUEST,
			receivedAt: Date.now(),
			query: 'Show all',
			aroundNodeId: null,
			displayNodes: DEFAULT_DISPLAY_NODES_PER_SEARCH,
			datasourceIds: [datasource.id],
			requestId: requestId
		});

		dispatch(searchReceive(datasource.items, requestId));
		dispatch(requestCompleted(requestId));
	}
}

export function dismissItemsToConfirm(search: Search) {
	return {
		type: DISMISS_ITEMS_TO_CONFIRM,
		payload: {
			search
		}
	};
}