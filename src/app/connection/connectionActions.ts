import {
    AUTH_CONNECTED,
    CANCEL_REQUEST,
    ERROR,
    REQUEST_COMPLETED,
    WEB_SOCKET_CONNECT,
    WEB_SOCKET_SEND
} from './connectionConstants';

export function requestCompleted(requestId) {
    return {
        type: REQUEST_COMPLETED,
        requestId: requestId
    };
}

export function authConnected(connected: boolean, errors: string) {
    return {
        type: AUTH_CONNECTED,
        payload: {
            connected: connected,
            errors: errors
        }
    };
}

interface WebSocketSendPayload {
    type: string;
    [key: string]: any;
}

export function webSocketSend(payload: WebSocketSendPayload) {
    return {
        type: WEB_SOCKET_SEND,
        payload: payload
    };
}

export function webSocketConnect() {
    return {
        type: WEB_SOCKET_CONNECT
    }
}

export function cancelRequest(requestId) {
    return webSocketSend({
        type: CANCEL_REQUEST,
        requestId: requestId
    });
}

export function error(errors: string) {
    return {
        type: ERROR,
        payload: {
            errors: errors
        }
    };
}