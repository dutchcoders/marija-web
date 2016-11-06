import { INDICES_RECEIVE, INDICES_REQUEST} from './index'

export function requestIndices(server) {
    return {
        type: INDICES_REQUEST,
        payload: {
            server
        }
    }
}

export function receiveIndices(response) {
    return {
        type: INDICES_RECEIVE,
        payload: {
            ...response
        }
    }
}