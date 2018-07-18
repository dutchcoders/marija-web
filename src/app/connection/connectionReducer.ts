import {ConnectionState} from "./interfaces/connectionState";
import {AUTH_CONNECTED, ERROR, SET_BACKEND_URI} from "./connectionConstants";

export const defaultConnectionState: ConnectionState = {
    backendUri: null,
    connected: false,
    requestErrors: {},
    genericErrors: ''
};

export default function connectionReducer(state: ConnectionState = defaultConnectionState, action): ConnectionState {
    switch (action.type) {
        case AUTH_CONNECTED: {
            return {
                ...state,
                connected: action.payload.connected,
                genericErrors: action.payload.errors
            };
        }

        case ERROR: {
            const error: string = action.payload.error;
            const requestId: string = action.payload.requestId;

            if (requestId) {
                return {
                    ...state,
                    requestErrors: {
                        ...state.requestErrors,
                        [requestId]: error
                    }
                };
            }

            return {
                ...state,
                genericErrors: error
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