import {Search} from '../search/interfaces/search';
import {SEARCH_DELETE} from '../search/searchConstants';
import {
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED,
	INITIAL_STATE_RECEIVE, UPDATE_DATASOURCE
} from './datasourcesConstants';
import {Datasource} from './interfaces/datasource';
import {DatasourcesState} from "./interfaces/datasourcesState";
import { getIcon } from '../graph/helpers/getIcon';
import { RECEIVE_WORKSPACE } from '../ui/uiConstants';
import { Workspace } from '../ui/interfaces/workspace';
import { FIELDS_RECEIVE } from '../fields/fieldsConstants';
import { Field } from '../fields/interfaces/field';

export const defaultDatasourcesState: DatasourcesState = {
    datasources: []
};

export default function datasourcesReducer(state: DatasourcesState = defaultDatasourcesState, action) {
    switch (action.type) {
        case INITIAL_STATE_RECEIVE: {
            const datasources: Datasource[] = action.initial_state.datasources.map(datasource => {
                const existing = state.datasources.find(search => search.id === datasource.id);

                return {
                    id: datasource.id,
                    name: datasource.name,
                    active: typeof existing === 'undefined' ? false : existing.active,
                    type: datasource.type,
                    icon: existing ? existing.icon : getIcon(datasource.name, []),
                    imageFieldPath: existing ? existing.imageFieldPath : null,
                    labelFieldPath: existing ? existing.labelFieldPath : null,
                    locationFieldPath: existing ? existing.locationFieldPath : null,
                    dateFieldPath: existing ? existing.dateFieldPath : null,
                };
            });

            datasources.sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }

                if (a.name > b.name) {
                    return 1;
                }

                return 0;
            });

            return Object.assign({}, state, {
                datasources: datasources
            });
        }

		case FIELDS_RECEIVE: {
			const fields: Field[] = action.payload.fields;

			if (!fields) {
				return state;
			}

			const datasourceId: string = action.payload.datasource;
			const datasources = state.datasources.concat([]);
			const index = datasources.findIndex(datasource => datasource.id === datasourceId);

			if (index === -1) {
				return state;
			}

			const datasource = { ...datasources[index] };

			if (typeof datasource.dateFieldPath === 'undefined') {
				const field = fields.find(field => field.type === 'date');

				if (field) {
					datasource.dateFieldPath = field.path;
				}
			}

			if (typeof datasource.imageFieldPath === 'undefined') {
				const field = fields.find(field => field.type === 'image');

				if (field) {
					datasource.imageFieldPath = field.path;
				}
			}

			if (typeof datasource.locationFieldPath === 'undefined') {
				const field = fields.find(field => field.type === 'location');

				if (field) {
					datasource.locationFieldPath = field.path;
				}
			}

			if (typeof datasource.labelFieldPath === 'undefined') {
				const field = fields.find(field => field.type === 'text' || field.type === 'string');

				if (field) {
					datasource.labelFieldPath = field.path;
				}
			}

			datasources[index] = datasource;

			return {
				...state,
				datasources
			};
		}

        case DATASOURCE_ACTIVATED: {
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasourceId);

            // It's already active
            if (state.datasources[index].active) {
                return state;
            }

            const datasources = state.datasources.concat([]);
            datasources[index] = Object.assign({}, datasources[index], {
                active: true
            });

            return Object.assign({}, state, {
                datasources: datasources
            });
        }
        case DATASOURCE_DEACTIVATED: {
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasourceId);

            // It's already inactive
            if (!state.datasources[index].active) {
                return state;
            }

            const datasources = state.datasources.concat([]);
            datasources[index] = Object.assign({}, datasources[index], {
                active: false
            });

            return Object.assign({}, state, {
                datasources: datasources
            });
        }

        /**
         * If a search which was actually a live datasource query gets deleted,
         * we need to also deactivate the datasource.
         */
        case SEARCH_DELETE: {
            const search: Search = action.payload.search;

            if (!search.liveDatasource) {
                // The deleted search it not a live datasource, do nothing.
                return state;
            }

            const index: number = state.datasources.findIndex(datasource => datasource.id === search.liveDatasource);

            const newDatasources = state.datasources.concat([]);
            newDatasources[index] = Object.assign({}, newDatasources[index], {
                active: false
            });

            return Object.assign({}, state,  {
                datasources: newDatasources
            });
        }

        case UPDATE_DATASOURCE: {
            const index = state.datasources.findIndex(datasource => datasource.id === action.payload.datasourceId);
            const datasources = state.datasources.concat([]);
            datasources[index] = {
                ...datasources[index],
                ...action.payload.props
            };

            return {
                ...state,
                datasources
            }
        }

		case RECEIVE_WORKSPACE: {
			const workspace: Workspace = action.payload.workspace;

			return {
				...state,
				datasources: workspace.datasources
			};
		}

        default:
            return state;
    }
}
