import { FIELDS_RECEIVE, FIELDS_REQUEST } from './index'


export function receiveFields(payload) {
    return {
        type: FIELDS_RECEIVE,
        payload: {
            ...payload
        }
    };
}

export function getFields(hosts) {
    return {
        type: FIELDS_REQUEST,
        payload: {
            host: hosts
        }
    };
}
