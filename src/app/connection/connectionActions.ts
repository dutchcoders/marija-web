import {
    AUTH_CONNECTED,
    CANCEL_REQUEST,
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

export function authConnected(p) {
    return {
        type: AUTH_CONNECTED,
        receivedAt: Date.now(),
        ...p
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