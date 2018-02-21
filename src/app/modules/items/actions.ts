import {ITEMS_REQUEST} from "./constants";
import {Item} from "../../interfaces/item";

export function requestItems(items: Item[]) {
    return {
        type: ITEMS_REQUEST,
        items: items
    }
}