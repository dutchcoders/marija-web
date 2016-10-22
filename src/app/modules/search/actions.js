import { RECEIVE_ITEMS, REQUEST_ITEMS, DELETE_SEARCH } from './index'

const defaultOpts = {
    from: 0,
    size: 50,
    index: "",
    query: "",
    color: ""
};

export function requestItems(opts = defaultOpts) {
    return {
        type: REQUEST_ITEMS,
        receivedAt: Date.now(),
        ...opts
    }
}

export function receiveItems(items, opts = {from: 0}) {
    return {
        type: RECEIVE_ITEMS,
        items: items,
        receivedAt: Date.now()
    }
}

export function deleteSearch(opts) {
    return {
        type: DELETE_SEARCH,
        receivedAt: Date.now(),
        ...opts
    }
}