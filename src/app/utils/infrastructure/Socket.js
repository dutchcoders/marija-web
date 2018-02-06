import {FlowWS, error} from '../../utils/index';
import {searchReceive, SEARCH_RECEIVE, SEARCH_COMPLETED} from '../../modules/search/index';
import {receiveIndices, INDICES_RECEIVE} from '../../modules/indices/index';
import {receiveFields, FIELDS_RECEIVE} from '../../modules/fields/index';
import {
    receiveInitialState,
    INITIAL_STATE_RECEIVE
} from '../../modules/data/index';
import {searchCompleted} from "../../modules/search/actions";

export const Socket = {
    ws: null,
    searchResults: {},
    searchTimeouts: {},
    searchReceive: (newResults, query, dispatch) => {
        if (newResults === null) {
            return;
        }

        let results = Socket.searchResults[query] || [];

        for ( var i = 0; i < newResults.length; i++ ) {
            let result = newResults[i];

            let index = results.findIndex((item) => (item.id == result.id));

            if (index == -1) {
                results.push(result);
                continue;
            }

            // already exists, update count
            results[index].count = result.count;
        };

        Socket.searchResults[query] = results;

        clearTimeout(Socket.searchTimeouts[query]);

        Socket.searchTimeouts[query] = setTimeout(() => {
            dispatch(searchReceive({
                results: Socket.searchResults[query],
                query: query,
            }));

            delete Socket.searchResults[query];
        }, 500);
    },
    wsDispatcher: (message, dispatch) => {
        if (message.error) {
            return dispatch(error(message.error.message));
        }

        switch (message.type) {
            case SEARCH_RECEIVE:
                Socket.searchReceive(message.results, message.query, dispatch);
                break;

            case INDICES_RECEIVE:
                dispatch(receiveIndices(message.indices));
                break;

            case FIELDS_RECEIVE:
                dispatch(receiveFields(message.fields));
                break;

            case INITIAL_STATE_RECEIVE:
                dispatch(receiveInitialState({
                    datasources: message.datasources,
                    version: message.version
                }));
                break;

            case SEARCH_COMPLETED:
                dispatch(searchCompleted(message['request-id']));
        }
    },
    startWS: (dispatch) => {
        if (!!Socket.ws) {
            return;
        }

        let url;

        if (process.env.WEBSOCKET_URI) {
            url = process.env.WEBSOCKET_URI;
        } else {
            const {location} = window;
            url = ((location.protocol === "https:") ? "wss://" : "ws://") + location.host + "/ws";
        }

        try {
            Socket.ws = new FlowWS(url, null, Socket.wsDispatcher, dispatch);
        } catch (e) {
            dispatch(error(e));
        }
    }
};
