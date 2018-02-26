import {LIVE_RECEIVE} from "./constants";
import {Item} from "../../interfaces/item";
import {Datasource} from "../../interfaces/datasource";

export function liveReceive(datasource: Datasource, graphs: Item[]) {
    return {
        type: LIVE_RECEIVE,
        datasource: datasource,
        graphs: graphs
    };
}

export function preLiveReceive(datasource: Datasource, graphs: Item[]) {
    return (dispatch, getState) => {
        const datasources = getState().indices.activeIndices;

        // Only do something with the data if the datasource is active
        if (datasources.indexOf(datasource) !== -1) {
            dispatch(liveReceive(datasource, graphs));
        }
    };
}