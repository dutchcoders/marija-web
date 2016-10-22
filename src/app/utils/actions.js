import {ERROR, AUTH_CONNECTED} from './index';

export function error(msg) {
    return {
        type: ERROR,
        receivedAt: Date.now(),
        errors: msg
    }
}

export  function authConnected(p) {
    return {
        type: AUTH_CONNECTED,
        receivedAt: Date.now(),
        ...p
    }
}
