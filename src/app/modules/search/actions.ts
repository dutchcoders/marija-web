import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE} from "./constants";
import {Node} from "../../interfaces/node";
import {Search} from "../../interfaces/search";
import {Item} from "../../interfaces/item";
import {cancelRequest} from '../../reducers/utils';
import {Socket} from "../../utils";
import {uniqueId} from 'lodash';
import {ADD_LIVE_DATASOURCE_SEARCH, ACTIVATE_LIVE_DATASOURCE, DEACTIVATE_LIVE_DATASOURCE} from './constants';
import {Datasource} from "../../interfaces/datasource";

export function searchRequest(query: string) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch({
            type: SEARCH_REQUEST,
            receivedAt: Date.now(),
            query: query,
            aroundNodeId: null,
            displayNodes: 500,
            datasources: state.datasources.datasources
        });
    };
}

export function searchAround(node: Node) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch({
            type: SEARCH_REQUEST,
            receivedAt: Date.now(),
            query: node.name,
            aroundNodeId: node.id,
            displayNodes: 500,
            datasources: state.datasources.datasources
        });
    };
}

export function searchReceive(items: Item[], query: string) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch({
            type: SEARCH_RECEIVE,
            meta: {
                WebWorker: true
            },
            payload: {
                items: items,
                query: query,
                prevNodes: state.entries.nodes,
                prevLinks: state.entries.links,
                prevItems: state.entries.items,
                fields: state.entries.fields,
                normalizations: state.entries.normalizations,
                searches: state.entries.searches,
                deletedNodes: state.entries.deletedNodes,
                via: state.entries.via,
                receivedAt: Date.now()
            }
        });
    }
}

export function deleteSearch(search: Search) {
    return {
        type: SEARCH_DELETE,
        receivedAt: Date.now(),
        payload: {
            search: search
        }
    };
}

export function editSearch(query, opts) {
    return {
        type: SEARCH_EDIT,
        receivedAt: Date.now(),
        query: query,
        opts: opts
    };
}

export function searchFieldsUpdate() {
    return (dispatch, getState) => {
        const datasources = getState()
            .datasources
            .datasources
            .filter((datasource: Datasource) =>
                datasource.active && datasource.type !== 'live'
            );

        dispatch({
            type: SEARCH_FIELDS_UPDATE,
            receivedAt: Date.now(),
            payload: {
                datasources: datasources
            }
        });
    }
}

export function pauseSearch(search: Search) {
    cancelRequest(search.requestId);

    return {
        type: SEARCH_EDIT,
        receivedAt: Date.now(),
        query: search.q,
        opts: {
            paused: true
        }
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
        const state = getState();
        const fields: string[] = state
            .entries
            .fields
            .map(field => field.path);

        const requestId = uniqueId();

        Socket.ws.postMessage({
            datasources: search.datasources,
            query: search.q,
            fields: fields,
            'request-id': requestId
        });

        dispatch({
            type: SEARCH_EDIT,
            receivedAt: Date.now(),
            query: search.q,
            opts: {
                paused: false,
                requestId: requestId
            }
        });
    };
}