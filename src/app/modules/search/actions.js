import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, DISPLAY_LESS, SEARCH_EDIT } from './index';
import {SEARCH_FIELDS_UPDATE} from "./constants";

const defaultOpts = {
    displayNodes: 500,
    index: '',
    query: '',
    fields: [],
    completed: false,
    aroundNodeId: null
};

export function searchRequest(opts) {
    const newOpts = Object.assign({}, defaultOpts, opts);

    return {
        type: SEARCH_REQUEST,
        receivedAt: Date.now(),
        ...newOpts
    };
}

export function preSearchRequest(opts) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch(searchRequest({
            query: opts.query,
            aroundNodeId: opts.aroundNodeId,
            datasources: state.datasources.datasources
        }));
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