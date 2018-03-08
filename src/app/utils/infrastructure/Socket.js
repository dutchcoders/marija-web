import {FlowWS, error} from '../../utils/index';
import {searchReceive, SEARCH_RECEIVE} from '../../modules/search/index';
import {receiveFields, FIELDS_RECEIVE} from '../../modules/fields/index';
import {
    receiveInitialState,
    INITIAL_STATE_RECEIVE
} from '../../modules/data/index';
import {requestCompleted} from "../actions";
import {REQUEST_COMPLETED} from "../constants";
import {ITEMS_RECEIVE} from "../../modules/items/constants";
import {receiveItems} from "../../modules/items/actions";

export const Socket = {
    ws: null,
    searchResults: {},
    searchTimeouts: {},

    /**
     * Sometimes we receive many items from the server in quick succession of
     * each other. This is not good, because then we would need to calculate the
     * graph for each time we receive it (so multiple times per second).
     *
     * Instead, we wait for 500ms and bundle all of the items together.
     *
     * @param newResults
     * @param query
     * @param dispatch
     */
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
            dispatch(searchReceive(Socket.searchResults[query], query));

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

            case 'LIVE_RECEIVE':
                Socket.searchReceive(message.graphs, message.datasource, dispatch);
                break;

            case FIELDS_RECEIVE:
                dispatch(receiveFields(message.fields, message.datasource));
                break;

            case INITIAL_STATE_RECEIVE:
                dispatch(receiveInitialState({
                    datasources: message.datasources,
                    version: message.version
                }));
                break;

            case REQUEST_COMPLETED:
                dispatch(requestCompleted(message['request-id']));
                break;

            case ITEMS_RECEIVE:
                dispatch(receiveItems(message.items, message['item-id']));
                break;

            case 'ERROR':
                dispatch(error(message.message));

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

        console.log('%cMarija', 'font-size:40px;color:#blue;text-shadow:0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1),0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);');
        console.log(`Using backend: ${ url }`);
        try {
            Socket.ws = new FlowWS(url, null, Socket.wsDispatcher, dispatch);
        } catch (e) {
            dispatch(error(e));
        }
    }
};
