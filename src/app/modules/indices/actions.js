import { RECEIVE_INDICES, REQUEST_INDICES} from './index'

export function requestIndices(server) {
    return {
        type: REQUEST_INDICES,
        payload: {
            server
        }
    }
}

export function receiveIndices(response) {
    return {
        type: RECEIVE_INDICES,
        payload: {
            ...response
        }
    }
}