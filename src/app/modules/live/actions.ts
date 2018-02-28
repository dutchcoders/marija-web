import {LIVE_RECEIVE} from "./constants";
import {Item} from "../../interfaces/item";
import {Datasource} from "../../interfaces/datasource";

export function liveReceive(datasourceId: string, graphs: Item[]) {
    return (dispatch, getState) => {
        const datasources: Datasource[] = getState().datasources.datasources;
        const datasource = datasources.find(search => search.id === datasourceId);

        // Only do something with the data if the datasource is active
        if (!datasource.active) {
            return;
        }

        dispatch({
            type: LIVE_RECEIVE,
            datasource: datasource,
            graphs: graphs
        });
    };
}