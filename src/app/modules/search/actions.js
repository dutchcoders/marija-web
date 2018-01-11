import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE, DISPLAY_LESS, SET_DISPLAY_NODES } from './index';

const defaultOpts = {
    from: 0,
    size: 500,
    displayNodes: 500,
    index: '',
    query: '',
    color: '',
    fields: []
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

export function setDisplayNodes(query, newAmount) {
    return {
        type: SET_DISPLAY_NODES,
        receivedAt: Date.now(),
        query: query,
        newAmount: newAmount
    };
}