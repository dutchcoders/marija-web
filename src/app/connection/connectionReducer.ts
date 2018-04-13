import {ConnectionState} from "./interfaces/connectionState";
import {AUTH_CONNECTED, ERROR} from "./connectionConstants";

export const defaultConnectionState: ConnectionState = {
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
            }
        }

        default: {
            return state;
        }
    }
}