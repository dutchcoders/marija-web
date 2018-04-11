import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE, LIVE_RECEIVE} from "./searchConstants";
import {Node} from "../graph/interfaces/node";
import {Search} from "./interfaces/search";
import {Item} from "../items/interfaces/item";
import {uniqueId} from 'lodash';
import {ADD_LIVE_DATASOURCE_SEARCH, ACTIVATE_LIVE_DATASOURCE, DEACTIVATE_LIVE_DATASOURCE} from './searchConstants';
import {Datasource} from "../datasources/interfaces/datasource";
import {GraphWorkerPayload} from "../graph/helpers/graphWorkerClass";
import {AppState} from "../main/interfaces/appState";
import {cancelRequest, webSocketSend} from "../connection/connectionActions";

export function searchRequest(query: string, datasourceIds: string[]) {
    return (dispatch, getState) => {
        const state: AppState = getState();
        let fieldPaths: string[] = state.graph.fields.map(field => field.path);
        fieldPaths = fieldPaths.concat(state.graph.date_fields.map(field => field.path));

        const requestId = uniqueId();

        dispatch(webSocketSend({
            type: SEARCH_REQUEST,
            datasources: datasourceIds,
            fields: fieldPaths,
            query: query,
            'request-id': requestId
        }));

        dispatch({
            type: SEARCH_REQUEST,
            receivedAt: Date.now(),
            query: query,
            aroundNodeId: null,
            displayNodes: 500,
            datasourceIds: datasourceIds,
            requestId: requestId
        });
    };
}

export function searchAround(node: Node, datasourceIds: string[]) {
    return {
        type: SEARCH_REQUEST,
        receivedAt: Date.now(),
        query: node.name,
        aroundNodeId: node.id,
        displayNodes: 500,
        datasourceIds: datasourceIds
    };
}

function getGraphWorkerPayload(state: AppState, items: Item[], searchId: string): GraphWorkerPayload {
    return {
        items: items,
        searchId: searchId,
        prevNodes: state.graph.nodes,
        prevLinks: state.graph.links,
        prevItems: state.graph.items,
        fields: state.graph.fields,
        normalizations: state.graph.normalizations,
        searches: state.graph.searches,
        deletedNodes: state.graph.deletedNodes,
        via: state.graph.via,
        receivedAt: Date.now(),
        sortType: state.table.sortType,
        sortColumn: state.table.sortColumn
    };
}

export function searchReceive(items: Item[], requestId: string) {
    return (dispatch, getState) => {
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

export function searchFieldsUpdate() {
    return (dispatch, getState) => {
        const state: AppState = getState();

        const datasources = state
            .datasources
            .datasources
            .filter((datasource: Datasource) =>
                datasource.active && datasource.type !== 'live'
            );

        let fields = state.graph.fields.map(field => field.path);
        fields = fields.concat(state.graph.date_fields.map(field => field.path));

        const newSearches = state.graph.searches.map(search => {
            if (search.liveDatasource) {
                return search;
            }

            if (!search.completed) {
                dispatch(cancelRequest(search.requestId));
            }

            const newRequestId = uniqueId();

            dispatch(webSocketSend({
                type: SEARCH_REQUEST,
                datasources: search.datasources,
                query: search.q,
                fields: fields,
                'request-id': newRequestId
            }));

            return {
                ...search,
                requestId: newRequestId,
                completed: false
            };
        });

        dispatch({
            type: SEARCH_FIELDS_UPDATE,
            payload: {
                searches: newSearches
            }
        });
    }
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
        const fields: string[] = state
            .graph
            .fields
            .map(field => field.path);

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