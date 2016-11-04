import { FlowWS, error } from '../../utils/index';
import {receiveItems} from '../../modules/search/index';

export const Socket = {
    ws: null,
    URL: 'ws://' + "127.0.0.1:8089" + '/ws', 
    // URL: 'ws://' + location.host + '/ws', 
    wsDispatcher: (msg, storeDispatcher) => {
        if (msg.hits) {
            return storeDispatcher(receiveItems(msg.hits));
        } else if (msg.error) {
            return storeDispatcher(error(msg.error.message));
        } else {
            console.debug("unknown message type", msg);
        }
    },
    startWS: (dispatch) => {
        if (!!Socket.ws) {
            return;
        }

        try {
            Socket.ws = new FlowWS(Socket.URL, null, Socket.wsDispatcher, dispatch)
        } catch (e) {
            dispatch(error(e));
        }
    }
};
