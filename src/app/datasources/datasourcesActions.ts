import { getFields } from '../fields/fieldsActions';
import {
	addLiveDatasourceSearch
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
import { Item } from '../items/interfaces/item';
import { FIELDS_RECEIVE } from '../fields/fieldsConstants';

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

export function createCustomDatasource(name: string, items: Item[]) {
	return (dispatch, getState) => {
		dispatch({
			type: CREATE_CUSTOM_DATASOURCE,
			payload: {
				name,
				items
			}
		});

		const fieldPaths: string[] = Object.keys(items[0].fields);
		const fields = fieldPaths.map(path => ({
			path: path,
			type: 'string',
			datasourceId: name
		}));

		dispatch({
			type: FIELDS_RECEIVE,
			payload: {
				datasource: name,
				fields: fields
			}
		});
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