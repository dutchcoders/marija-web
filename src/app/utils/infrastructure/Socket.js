import { FlowWS, error } from '../../utils/index';
import { receiveItems, RECEIVE_ITEMS } from '../../modules/search/index';
import { receiveIndices, RECEIVE_INDICES } from '../../modules/indices/index';

export const Socket = {
    ws: null,
    URL: 'ws://' + location.host + '/ws',
    wsDispatcher: (message, storeDispatcher) => {
        if (message.error) {
            return storeDispatcher(error(message.error.message));
        }

        let handler = () => {
            console.debug("unknown message type");
        };

        switch (message.type) {
            case RECEIVE_ITEMS:
                handler = receiveItems;
                break;

            case RECEIVE_INDICES:
                handler = receiveIndices;
                break;
        }

        if (message.hits) {
            return storeDispatcher(handler(message.hits));
        }
    },
    startWS: (dispatch) => {
        if (!!Socket.ws) {
            return;
        }

        try {
            Socket.ws = new FlowWS(Socket.URL, null, Socket.wsDispatcher, dispatch);
        } catch (e) {
            dispatch(error(e));
        }
    }
};
