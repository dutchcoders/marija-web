import {ITEMS_RECEIVE, ITEMS_REQUEST} from "./constants";
import {Item} from "../../interfaces/item";
import {uniqueId, chunk} from 'lodash';
import {webSocketSend} from "../../utils/utilsActions";

export function requestItems(items: Item[]) {
    return (dispatch, getState) => {
        const ids: string[] = items.map(item => item.id);
        const chunks = chunk(ids, 10);

        chunks.forEach(batch => {
            const payload = {
                'request-id': uniqueId(),
                items: batch
            };

            dispatch(webSocketSend({
                type: ITEMS_REQUEST,
                payload: payload
            }));
        });

        dispatch({
            type: ITEMS_REQUEST,
            items: items
        });
    }
}

export function receiveItems(items: Item[], prevItemId: string) {
    return {
        type: ITEMS_RECEIVE,
        items: items,
        prevItemId: prevItemId
    };
}