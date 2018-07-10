import {
    REQUEST_COMPLETED, WEB_SOCKET_CONNECT,
    WEB_SOCKET_SEND
} from '../connectionConstants';
import * as ReconnectingWebsocket from 'reconnecting-websocket';
import {Dispatch, Middleware} from 'redux';
import {authConnected, error} from "../connectionActions";
import {Item} from "../../items/interfaces/item";
import {liveReceive, searchReceive} from "../../search/searchActions";
import {requestCompleted} from "../connectionActions";
import {receiveItems} from "../../items/itemsActions";
import {FIELDS_RECEIVE} from "../../fields/fieldsConstants";
import {receiveFields} from "../../fields/fieldsActions";
import {LIVE_RECEIVE, SEARCH_RECEIVE} from "../../search/searchConstants";
import {ITEMS_RECEIVE} from "../../items/itemsConstants";
import {INITIAL_STATE_RECEIVE} from "../../datasources/datasourcesConstants";
import {receiveInitialState} from "../../datasources/datasourcesActions";
import Timer = NodeJS.Timer;
import { getResponses } from './mockServer';

let opened: Promise<ReconnectingWebsocket>;

export const webSocketMiddleware: Middleware = ({dispatch}) => next => action => {
    switch (action.type) {
        case WEB_SOCKET_CONNECT: {
            const backendUri: string = action.payload.backendUri;
            console.log('Connecting to backend on ', backendUri);

            opened = new Promise(resolve => {
                const socket = new ReconnectingWebsocket(backendUri);

                socket.onopen = event => {onOpen(dispatch); resolve(socket)};
                socket.onmessage = event => onMessage(event, dispatch);
                socket.onclose = event => onClose(event, dispatch);
                socket.onerror = event => onClose(event, dispatch);
            });

            break;
        }

        case WEB_SOCKET_SEND: {
            const payload: string = JSON.stringify(action.payload);
            console.log('Send', action.payload);
            let mockedResponses;

            if (process.env.MOCK_SERVER) {
                mockedResponses = getResponses(action.payload) as MessageEvent[];
            }

            if (mockedResponses) {
                mockedResponses.forEach(response => {
                    console.log('Mocking server response', response);
                    onMessage(response, dispatch);
				});
            } else {
				opened.then(socket => socket.send(payload));
            }

            break;
        }
    }

    return next(action);
};

function onOpen(dispatch: Dispatch<any>) {
    dispatch(authConnected(true, null));
}

function onMessage(event: MessageEvent, dispatch: Dispatch<any>) {
    const data = JSON.parse(event.data);

    console.log('Receive', data.type);

    switch (data.type) {
        case SEARCH_RECEIVE: {
        	debounceItems(
                data.results,
                data['request-id'],
                dispatch,
                false,
                data.datasource
            );
            break;
        }
        case LIVE_RECEIVE: {
            debounceItems(
                data.graphs,
                data.datasource,
                dispatch,
                true,
                data.datasource
            );
            break;
        }
        case FIELDS_RECEIVE:
            const defaults = data.default;
            let defaultFields;
            let defaultVia;

            if (defaults) {
                defaultFields = defaults.fields;
                defaultVia = defaults.via;
            }

            dispatch(receiveFields(data.fields, data.datasource, defaultFields, defaultVia));
            break;

        case INITIAL_STATE_RECEIVE:
            dispatch(receiveInitialState({
                datasources: data.datasources,
                version: data.version
            }));
            break;

        case REQUEST_COMPLETED:
            dispatch(requestCompleted(data['request-id']));
            break;

        case ITEMS_RECEIVE:
            dispatch(receiveItems(data.items, data['item-id']));
            break;

        case 'ERROR':
            dispatch(error(data.message));
    }
}

function onClose(event: CloseEvent, dispatch: Dispatch<any>) {
    let reason = getCloseMessage(event);

    dispatch(authConnected(false, reason));
}

function getCloseMessage(event: CloseEvent): string {
    switch (event.code) {
        case 1000:
            return 'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
        case 1001:
            return 'An endpoint is \'going away\', such as a server going down or a browser having navigated away from a page.';
        case 1002:
            return 'An endpoint is terminating the connection due to a protocol error';
        case 1003:
            return 'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
        case 1004:
            return 'Reserved. The specific meaning might be defined in the future.';
        case 1005:
            return 'No status code was actually present.';
        case 1006:
            return 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
        case 1007:
            return 'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).';
        case 1008:
            return 'An endpoint is terminating the connection because it has received a message that \'violates its policy\'. This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
        case 1009:
            return 'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
        case 1010: // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead:
            return 'An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn\'t return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: ' + event.reason;
        case 1011:
            return 'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
        case 1015:
            return 'The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
        default:
            return 'Unknown reason';
    }
}


interface ItemsTimeout {
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

const debouncedItems: {
    [requestId: string]: Item[]
} = {};
const debounceTimeouts: {
    [requestId: string]: ItemsTimeout
} = {};
const timeoutMs = 500;
const maxTimeoutMs = 2000;

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
 * @param isLive
 * @param datasourceId
 */
function debounceItems(newItems: Item[], requestId: string, dispatch: Dispatch<any>, isLive: boolean, datasourceId: string) {
    if (newItems === null) {
        return;
    }

    newItems.forEach(item => {
        item.datasourceId = datasourceId
    });

    let results = debouncedItems[requestId] || [];

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

    debouncedItems[requestId] = results;

    const searchTimeout: any = debounceTimeouts[requestId] || {};

    const timeoutFinished = () => {
        clearTimeout(searchTimeout.bundleTimeout);
        clearTimeout(searchTimeout.maxTimeout);

        if (isLive) {
            dispatch(liveReceive(debouncedItems[requestId], datasourceId));
        } else {
            dispatch(searchReceive(debouncedItems[requestId], requestId));
        }

        delete debouncedItems[requestId];
    };

    // Dispatch when we haven't received any new items for 500 ms.
    clearTimeout(searchTimeout.bundleTimeout);
    searchTimeout.bundleTimeout = setTimeout(timeoutFinished, timeoutMs);

    // Only set the max timeout if it wasn't set already. It does not get
    // cleared when new items are received.
    if (!searchTimeout.maxTimeout) {
        // Dispatch also when the max timeout is finished
        searchTimeout.maxTimeout = setTimeout(timeoutFinished, maxTimeoutMs);
    }

    debounceTimeouts[requestId] = searchTimeout;
}