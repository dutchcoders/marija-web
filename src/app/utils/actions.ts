import {
    ERROR, AUTH_CONNECTED, OPEN_PANE, CLOSE_PANE, CANCEL_REQUEST,
    WEB_SOCKET_SEND, WEB_SOCKET_CONNECT
} from './constants';
import {
    MOVE_PANE_TO_TOP, REQUEST_COMPLETED,
    SET_PANE_CONFIG
} from "./constants";

export function error(msg) {
    return {
        type: ERROR,
        receivedAt: Date.now(),
        errors: msg
    };
}

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

export function openPane(pane) {
    return {
        type: OPEN_PANE,
        pane: pane
    };
}

export function closePane(pane) {
    return {
        type: CLOSE_PANE,
        pane: pane
    };
}

export function setPaneConfig(key, config) {
    return {
        type: SET_PANE_CONFIG,
        key: key,
        config: config
    };
}

export function movePaneToTop(key) {
    return {
        type: MOVE_PANE_TO_TOP,
        key: key
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