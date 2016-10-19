import { RECEIVE_ITEMS, REQUEST_ITEMS } from './index'

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

export function receiveItems(items, opts = {
    from: 0
}) {
    return {
        type: RECEIVE_ITEMS,
        items: items,
        receivedAt: Date.now()
    }
}