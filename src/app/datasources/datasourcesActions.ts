import { fieldAdd, getFields } from '../fields/fieldsActions';
import Url from '../main/helpers/url';
import {
	activateLiveDatasource,
	addLiveDatasourceSearch,
	searchFieldsUpdate
} from '../search/searchActions';
import {
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED,
	INITIAL_STATE_RECEIVE,
	UPDATE_DATASOURCE
} from './datasourcesConstants';
import { Datasource } from './interfaces/datasource';
import { triggerGraphWorker } from '../graph/graphActions';
import { getGraphWorkerPayload } from '../graph/helpers/getGraphWorkerPayload';
import { Field } from '../fields/interfaces/field';
import { AppState } from '../main/interfaces/appState';
import { getSelectedFields } from '../fields/fieldsSelectors';

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

export function updateDatasource(datasourceId: string, props: any) {
	return (dispatch, getState) => {
		const oldFields: Field[] = getSelectedFields(getState());

		dispatch({
			type: UPDATE_DATASOURCE,
			payload: {
				datasourceId,
				props
			}
		});

		const newState: AppState = getState();
		const newFields: Field[] = getSelectedFields(newState);
		const newField = newFields.find(field => {
			return typeof oldFields.find(search => search.path === field.path) === 'undefined';
		});

		if (newField) {
			// We have selected a field that wasnt there before, so we need to fetch more
			// data from the server
			dispatch(searchFieldsUpdate());
		} else {
			dispatch(triggerGraphWorker(getGraphWorkerPayload(newState)));
		}
	};
}