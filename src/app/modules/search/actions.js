import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, DISPLAY_LESS, SEARCH_EDIT } from './index';
import {FILTER_SEARCH_RESULTS} from "./constants";

const defaultOpts = {
    from: 0,
    size: 500,
    displayNodes: 500,
    index: '',
    query: '',
    color: '',
    fields: [],
    completed: false,
    aroundNodeId: null
};

export function searchRequest(opts) {
    const newOpts = Object.assign(defaultOpts, opts);

    return {
        type: SEARCH_REQUEST,
        receivedAt: Date.now(),
        ...newOpts
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

export function filterSearchResults(nodes) {
    return {
        type: FILTER_SEARCH_RESULTS,
        nodes: nodes
    };
}