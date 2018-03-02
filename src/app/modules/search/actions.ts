import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE} from "./constants";
import {Node} from "../../interfaces/node";

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

export function searchReceive(items, opts = {from: 0}) {
    return {
        type: SEARCH_RECEIVE,
        items: items,
        receivedAt: Date.now()
    };
}

export function deleteSearch(opts) {
    return {
        type: SEARCH_DELETE,
        receivedAt: Date.now(),
        ...opts
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
    return {
        type: SEARCH_FIELDS_UPDATE,
        receivedAt: Date.now()
    };
}