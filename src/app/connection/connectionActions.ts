import {
    AUTH_CONNECTED,
    CANCEL_REQUEST,
    ERROR,
    REQUEST_COMPLETED, SET_BACKEND_URI,
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

export function webSocketConnect(backendUri: string) {
    return {
        type: WEB_SOCKET_CONNECT,
        payload: {
            backendUri: backendUri
        }
    };
}

export function cancelRequest(requestId) {
    return webSocketSend({
        type: CANCEL_REQUEST,
        requestId: requestId
    });
}

export function error(error: string, requestId: string) {
    return {
        type: ERROR,
        payload: {
            error,
            requestId
        }
    };
}

export function setBackendUri(fromProps: string) {
    let backendUri: string;

    if (fromProps) {
        backendUri = fromProps;
    } else {
        const { location } = window;
        backendUri = ((location.protocol === 'https:') ? 'wss://' : 'ws://') + location.host + '/ws';
    }

    return {
        type: SET_BACKEND_URI,
        payload: {
            backendUri: backendUri
        }
    };
}