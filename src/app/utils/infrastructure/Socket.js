import { FlowWS, error } from '../../utils/index';
import { receiveItems, ITEMS_RECEIVE } from '../../modules/search/index';
import { receiveIndices, INDICES_RECEIVE} from '../../modules/indices/index';

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
            case ITEMS_RECEIVE:
                handler = receiveItems;
                break;

            case INDICES_RECEIVE:
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
