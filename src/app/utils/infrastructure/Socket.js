import { FlowWS, error } from '../../utils/index';
import { receiveItems, ITEMS_RECEIVE } from '../../modules/search/index';
import { receiveIndices, INDICES_RECEIVE} from '../../modules/indices/index';
import { receiveFields, FIELDS_RECEIVE} from '../../modules/fields/index';
import { receiveInitialState, INITIAL_STATE_RECEIVE } from '../../modules/data/index';

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
		storeDispatcher(receiveItems(message.items));
                break;

            case INDICES_RECEIVE:
		storeDispatcher(receiveIndices(message.indices));
                break;

            case FIELDS_RECEIVE:
		storeDispatcher(receiveFields(message.fields));
                break;

            case INITIAL_STATE_RECEIVE:
		storeDispatcher(receiveInitialState(message.state));
                break;
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
