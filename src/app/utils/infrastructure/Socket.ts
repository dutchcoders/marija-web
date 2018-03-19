import {FlowWS, error} from '../../utils/index';
import {searchReceive, SEARCH_RECEIVE} from '../../modules/search/index';
import {liveReceive} from '../../modules/search/actions';
import {LIVE_RECEIVE} from '../../modules/search/constants';
import {receiveFields, FIELDS_RECEIVE} from '../../modules/fields/index';
import {
    receiveInitialState,
    INITIAL_STATE_RECEIVE
} from '../../modules/data/index';
import {requestCompleted} from "../actions";
import {REQUEST_COMPLETED} from "../constants";
import {ITEMS_RECEIVE} from "../../modules/items/constants";
import {receiveItems} from "../../modules/items/actions";
import {Item} from "../../interfaces/item";
import {Dispatch} from "react-redux";
import Timer = NodeJS.Timer;

interface SearchTimeout {
    /**
     * Resets every time we receive new results, so that we bundle results that
     * are received in quick succession of each other.
     *
     * When the timeout completes, results are dispatched.
     *
     */
    bundleTimeout: Timer;

    /**
     * Does not reset when we receive new results. Used for solving the problem
     * of the above timeout: imagine that we keep on getting results quickly
     * forever -> the above timeout would never complete.
     *
     * When the timeout completes, results are dispatched.
     *
     */
    maxTimeout: Timer;
}

interface SocketInterface {
    ws: any;
    searchResults: {
        [requestId: string]: Item[]
    };
    searchTimeouts: {
        [requestId: string]: SearchTimeout
    };
    /**
     * Maximum age in ms for search results. We never wait longer than this with
     * dispatching search results.
     */
    bundleTimeoutMs: number;
    maxTimeoutMs: number;
    searchReceive: Function;
    wsDispatcher: Function;
    startWS: Function;
}

export const Socket: SocketInterface = {
    ws: null,
    searchResults: {},
    searchTimeouts: {},
    bundleTimeoutMs: 500,
    maxTimeoutMs: 2000,

    /**
     * Sometimes we receive many items from the server in quick succession of
     * each other. This is not good, because then we would need to calculate the
     * graph for each time we receive it (so multiple times per second).
     *
     * Instead, we wait for 500ms and bundle all of the items together.
     *
     * @param newItems
     * @param requestId
     * @param dispatch
     * @param liveDatasource
     */
    searchReceive: (newItems: Item[], requestId: string, dispatch: Dispatch<any>, liveDatasource: string|false) => {
        if (newItems === null) {
            return;
        }

        let results = Socket.searchResults[requestId] || [];

        for (let i = 0; i < newItems.length; i++ ) {
            let result = newItems[i];
            let index = results.findIndex((item) => item.id === result.id);

            if (index === -1) {
                results.push(result);
                continue;
            }

            // already exists, update count
            results[index].count = result.count;
        }

        Socket.searchResults[requestId] = results;

        const searchTimeout: any = Socket.searchTimeouts[requestId] || {};

        const timeoutFinished = () => {
            clearTimeout(searchTimeout.bundleTimeout);
            clearTimeout(searchTimeout.maxTimeout);

            if (liveDatasource) {
                dispatch(liveReceive(Socket.searchResults[requestId], liveDatasource));
            } else {
                dispatch(searchReceive(Socket.searchResults[requestId], requestId));
            }

            delete Socket.searchResults[requestId];
        };

        // Dispatch when we haven't received any new items for 500 ms.
        clearTimeout(searchTimeout.bundleTimeout);
        searchTimeout.bundleTimeout = setTimeout(timeoutFinished, Socket.bundleTimeoutMs);

        // Only set the max timeout if it wasn't set already. It does not get
        // cleared when new items are received.
        if (!searchTimeout.maxTimeout) {
            // Dispatch also when the max timeout is finished
            searchTimeout.maxTimeout = setTimeout(timeoutFinished, Socket.maxTimeoutMs);
        }

        Socket.searchTimeouts[requestId] = searchTimeout;
    },
    wsDispatcher: (message, dispatch) => {
        if (message.error) {
            return dispatch(error(message.error.message));
        }

        switch (message.type) {
            case SEARCH_RECEIVE: {
                Socket.searchReceive(
                    message.results,
                    message['request-id'],
                    dispatch,
                    false
                );
                break;
            }
            case LIVE_RECEIVE: {
                Socket.searchReceive(
                    message.graphs,
                    message.datasource,
                    dispatch,
                    message.datasource
                );
                break;
            }
            case FIELDS_RECEIVE:
                console.log(message);
                const defaults = message.default;
                let defaultFields;
                let defaultVia;

                if (defaults) {
                    defaultFields = defaults.fields;
                    defaultVia = defaults.via;
                }

                dispatch(receiveFields(message.fields, message.datasource, defaultFields, defaultVia));
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
