import {ITEMS_RECEIVE, ITEMS_REQUEST} from "./constants";
import {Item} from "../../interfaces/item";

export function requestItems(items: Item[]) {
    return {
        type: ITEMS_REQUEST,
        items: items
    }
}

export function receiveItems(items: Item[], prevItemId: string) {
    return {
        type: ITEMS_RECEIVE,
        items: items,
        prevItemId: prevItemId
    };
}