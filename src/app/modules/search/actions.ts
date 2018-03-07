import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE} from "./constants";
import {Node} from "../../interfaces/node";
import {Search} from "../../interfaces/search";

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

export function searchReceive(items) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch({
            type: SEARCH_RECEIVE,
            meta: {
                WebWorker: true
            },
            payload: {
                prevNodes: state.entries.nodes,
                prevLinks: state.entries.links,
                items: items,
                fields: state.entries.fields,
                normalizations: state.entries.normalizations,
                receivedAt: Date.now(),
                searches: state.entries.searches,
                deletedNodes: state.entries.deletedNodes,
                via: state.entries.via,
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
            .filter(datasource => datasource.active);

        dispatch({
            type: SEARCH_FIELDS_UPDATE,
            receivedAt: Date.now(),
            payload: {
                datasources: datasources
            }
        });
    }
}