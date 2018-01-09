import { SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_DELETE } from './index';

const defaultOpts = {
    from: 0,
    size: 500,
    index: '',
    query: '',
    color: '',
    fields: []
};

export function requestItems(opts = defaultOpts) {
    return {
        type: SEARCH_REQUEST,
        receivedAt: Date.now(),
        ...opts
    };
}

export function receiveItems(items, opts = {from: 0}) {
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
