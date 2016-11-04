import {authConnected, error} from '../index'
import Websocket from 'reconnecting-websocket';

export const SearchMessage = 1;
export const DiscoverIndicesMessage = 2;
export const DiscoverFieldsMessage = 3;

export default class FlowWS {
    constructor(url, token, dispatcher, storeDispatcher) {
        this.url = url;

        const websocket = new Websocket(url);

        websocket.onopen = function (event) {
            console.debug(event);
            storeDispatcher(authConnected({connected: true}));
        };
        websocket.onclose = function (event) {
            console.debug(event);
            storeDispatcher(authConnected({connected: false}));
        };
        websocket.onerror = function (event) {
            console.debug(event);
            
            storeDispatcher(error('test'));
        };
        websocket.onmessage = function (event) {
            dispatcher(JSON.parse(event.data), storeDispatcher);
        };

        this.websocket = websocket;
    }

    postMessage(data, type = SearchMessage) {
        this.websocket.send(
            JSON.stringify({
                event_type: type,
                ...data
            })
        );
    }

    close() {
        this.websocket.close();
    }
}
