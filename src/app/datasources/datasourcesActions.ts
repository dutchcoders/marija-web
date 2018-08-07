import {
	addLiveDatasourceSearch, searchRequest
} from '../search/searchActions';
import {
	CREATE_CUSTOM_DATASOURCE,
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED, DELETE_CUSTOM_DATASOURCE,
	INITIAL_STATE_RECEIVE,
	UPDATE_DATASOURCE
} from './datasourcesConstants';
import { Datasource } from './interfaces/datasource';
import { rebuildGraph } from '../graph/graphActions';
import { Item } from '../graph/interfaces/item';
import { Field } from '../fields/interfaces/field';
import { FieldMapping } from '../fields/interfaces/fieldMapping';
import { receiveFieldMapping } from '../fields/fieldsActions';
import Url from '../main/helpers/url';
import { AppState } from '../main/interfaces/appState';

export function datasourceActivated(datasource: Datasource) {
    return {
        type: DATASOURCE_ACTIVATED,
        payload: {
            datasource
        }
    };
}

export function datasourceDeactivated(datasource: Datasource) {
    return {
        type: DATASOURCE_DEACTIVATED,
        payload: {
            datasource
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

        const live: Datasource[] = initialState.datasources.filter((datasource: Datasource) =>
            datasource.type === 'live'
        );

        live.forEach(datasource => {
            dispatch(addLiveDatasourceSearch(datasource));
        });

        const state: AppState = getState();
		const active = state.datasources.datasources.filter(datasource =>
			datasource.active && datasource.type !== 'live'
		);

		// Check if there are some active datasources
		if (active.length > 0) {
			Url.getQueries().forEach(query =>
				dispatch(searchRequest(query))
			);
		} else {
			// Without active datasources we can remove the queries from the url,
			// because they have not been executed
			Url.getQueries().forEach(query =>
				Url.removeQuery(query)
			);
		}
    };
}

export interface DatasourceProps {
	imageFieldPath?: string | false;
	locationFieldPath?: string | false;
	labelFieldPath?: string | false;
	dateFieldPath?: string | false;
	chooseFieldsAutomatically?: boolean;
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

export function createCustomDatasource(name: string, items: Item[], fields: Field[]) {
	return (dispatch, getState) => {
		dispatch({
			type: CREATE_CUSTOM_DATASOURCE,
			payload: {
				name,
				items
			}
		});

		const mapping: FieldMapping = {};
		fields.forEach(field => {
			if (!mapping[field.datasourceId]) {
				mapping[field.datasourceId] = {};
			}

			mapping[field.datasourceId][field.path] = field.type;
		});

		dispatch(receiveFieldMapping(mapping));
	};
}

export function deleteCustomDatasource(datasource: Datasource) {
	return {
		type: DELETE_CUSTOM_DATASOURCE,
		payload: {
			datasource
		}
	};
}