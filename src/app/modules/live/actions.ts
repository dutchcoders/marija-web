import {LIVE_RECEIVE} from "./constants";
import {Item} from "../../interfaces/item";

export function liveReceive(datasource: string, graphs: Item[]) {
    return {
        type: LIVE_RECEIVE,
        datasource: datasource,
        graphs: graphs
    };
}