import {DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED} from './datasourcesConstants'
import {INITIAL_STATE_RECEIVE} from "./datasourcesConstants";
import {Datasource} from "./interfaces/datasource";
import {getFields} from "../fields/fieldsActions";
import {
    activateLiveDatasource,
    addLiveDatasourceSearch
} from "../search/searchActions";
import Url from "../main/helpers/Url";

export function datasourceActivated(datasourceId: string) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasourceId: datasourceId
        }
    };
}

export function datasourceDeactivated(datasourceId: string) {
    return {
        type: DATASOURCE_DEACTIVATED,
        payload: {
            datasourceId: datasourceId
        }
    };
}

export function receiveInitialState(initialState) {
    return (dispatch, getState) => {
        dispatch({
            type: INITIAL_STATE_RECEIVE,
            receivedAt: Date.now(),
            initial_state: initialState
        });

        const normal: Datasource[] = initialState.datasources.filter((datasource: Datasource) =>
            datasource.type !== 'live'
        );

        dispatch(getFields(normal));

        const live: Datasource[] = initialState.datasources.filter((datasource: Datasource) =>
            datasource.type === 'live'
        );

        live.forEach(datasource => {
            dispatch(addLiveDatasourceSearch(datasource));

            if (Url.isLiveDatasourceActive(datasource.id)) {
                dispatch(activateLiveDatasource(datasource.id));
            }
        });
    };
}