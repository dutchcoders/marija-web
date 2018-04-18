import {ConnectionState} from "./interfaces/connectionState";
import {AUTH_CONNECTED, ERROR, SET_BACKEND_URI} from "./connectionConstants";

export const defaultConnectionState: ConnectionState = {
    backendUri: null,
    connected: false,
    errors: null
};

export default function connectionReducer(state: ConnectionState = defaultConnectionState, action): ConnectionState {
    switch (action.type) {
        case AUTH_CONNECTED: {
            return {
                ...state,
                connected: action.payload.connected,
                errors: action.payload.errors
            };
        }

        case ERROR: {
            return {
                ...state,
                errors: action.payload.errors
            };
        }

        case SET_BACKEND_URI: {
            return {
                ...state,
                backendUri: action.payload.backendUri
            };
        }

        default: {
            return state;
        }
    }
}