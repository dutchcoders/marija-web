import { getFields } from '../fields/fieldsActions';
import {
	addLiveDatasourceSearch
} from '../search/searchActions';
import {
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED,
	INITIAL_STATE_RECEIVE,
	UPDATE_DATASOURCE
} from './datasourcesConstants';
import { Datasource } from './interfaces/datasource';
import { rebuildGraph } from '../graph/graphActions';

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
        });
    };
}

export interface DatasourceProps {
	imageFieldPath?: string | false;
	locationFieldPath?: string | false;
	labelFieldPath?: string | false;
	dateFieldPath?: string | false;
	icon?: string;
}

export function updateDatasource(datasourceId: string, props: DatasourceProps) {
	return (dispatch, getState) => {
		dispatch({
			type: UPDATE_DATASOURCE,
			payload: {
				datasourceId,
				props
			}
		});

		dispatch(rebuildGraph());
	};
}