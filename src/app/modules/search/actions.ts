import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE, LIVE_RECEIVE} from "./constants";
import {Node} from "../../interfaces/node";
import {Search} from "../../interfaces/search";
import {Item} from "../../interfaces/item";
import {cancelRequest} from '../../reducers/utils';
import {Socket} from "../../utils";
import {uniqueId} from 'lodash';
import {ADD_LIVE_DATASOURCE_SEARCH, ACTIVATE_LIVE_DATASOURCE, DEACTIVATE_LIVE_DATASOURCE} from './constants';
import {Datasource} from "../../interfaces/datasource";
import {GraphWorkerPayload} from "../graph/graphWorkerClass";

export function searchRequest(query: string, datasourceIds: string[]) {
    return {
        type: SEARCH_REQUEST,
        receivedAt: Date.now(),
        query: query,
        aroundNodeId: null,
        displayNodes: 500,
        datasourceIds: datasourceIds
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

function getGraphWorkerPayload(state, items: Item[], searchId: string): GraphWorkerPayload {
    return {
        items: items,
        searchId: searchId,
        prevNodes: state.entries.nodes,
        prevLinks: state.entries.links,
        prevItems: state.entries.items,
        fields: state.entries.fields,
        normalizations: state.entries.normalizations,
        searches: state.entries.searches,
        deletedNodes: state.entries.deletedNodes,
        via: state.entries.via,
        receivedAt: Date.now(),
        sortType: state.entries.sortType,
        sortColumn: state.entries.sortColumn
    };
}

export function searchReceive(items: Item[], requestId: string) {
    return (dispatch, getState) => {
        const state = getState();

        const search: Search = state.entries.searches.find((search: Search) =>
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
        const state = getState();

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
    return {
        type: SEARCH_DELETE,
        receivedAt: Date.now(),
        payload: {
            search: search
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
        searchId: search.searchId,
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
            searchId: search.searchId,
            opts: {
                paused: false,
                requestId: requestId
            }
        });
    };
}