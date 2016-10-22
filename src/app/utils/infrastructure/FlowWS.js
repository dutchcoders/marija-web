import {authConnected, error} from '../index'

export default class FlowWS {
    constructor(url, token, dispatcher, storeDispatcher) {
        const websocket = new WebSocket(url);

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

    postMessage(data) {
        this.websocket.send(
            JSON.stringify({
                event_type: 1,
                ...data,
            })
        );
    }

    close() {
        this.websocket.close();
    }
}