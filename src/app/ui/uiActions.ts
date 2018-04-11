import { CLOSE_PANE, ERROR, MOVE_PANE_TO_TOP, OPEN_PANE, SET_PANE_CONFIG } from './uiConstants';

export function error(msg) {
    return {
        type: ERROR,
        receivedAt: Date.now(),
        errors: msg
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