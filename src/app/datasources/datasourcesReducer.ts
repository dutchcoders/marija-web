import {Search} from '../search/interfaces/search';
import {SEARCH_DELETE} from '../search/searchConstants';
import {
	CREATE_CUSTOM_DATASOURCE,
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED, DELETE_CUSTOM_DATASOURCE,
	INITIAL_STATE_RECEIVE, UPDATE_DATASOURCE
} from './datasourcesConstants';
import {Datasource} from './interfaces/datasource';
import {DatasourcesState} from "./interfaces/datasourcesState";
import { getIcon } from '../graph/helpers/getIcon';
import { RECEIVE_WORKSPACE } from '../ui/uiConstants';
import { Workspace } from '../ui/interfaces/workspace';
import { Item } from '../graph/interfaces/item';
import {
	GRAPH_WORKER_OUTPUT,
	SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID
} from '../graph/graphConstants';
import { GraphWorkerOutput } from '../graph/helpers/graphWorkerClass';

export const defaultDatasourcesState: DatasourcesState = {
    datasources: [],
	expectedGraphWorkerOutputId: null
};

export default function datasourcesReducer(state: DatasourcesState = defaultDatasourcesState, action) {
    switch (action.type) {
        case INITIAL_STATE_RECEIVE: {
            let datasources: Datasource[] = action.initial_state.datasources.map(datasource => {
                const existing = state.datasources.find(search => !search.isCustom && search.id === datasource.id);

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
					chooseFieldsAutomatically: existing ? existing.chooseFieldsAutomatically : true
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

			// Add custom datasources from the workspace
			datasources = datasources.concat(state.datasources.filter(datasource =>
				datasource.isCustom
			));

            return Object.assign({}, state, {
                datasources: datasources
            });
        }

        case DATASOURCE_ACTIVATED: {
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasource.id);

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
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasource.id);

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

		case CREATE_CUSTOM_DATASOURCE: {
			const name: string = action.payload.name;
			const items: Item[] = action.payload.items;

			const datasource: Datasource = {
				name: name,
				id: name,
				active: true,
				type: 'csv',
				isCustom: true,
				icon: getIcon(name, []),
				items: items,
				labelFieldPath: null,
				imageFieldPath: null,
				locationFieldPath: null,
				dateFieldPath: null,
				chooseFieldsAutomatically: true
			};

			return {
				...state,
				datasources: state.datasources.concat([datasource])
			};
		}

		case DELETE_CUSTOM_DATASOURCE: {
			const datasource: Datasource = action.payload.datasource;

			return {
				...state,
				datasources: state.datasources.filter(search => search.id !== datasource.id)
			};
		}

		case SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID: {
			return {
				...state,
				expectedGraphWorkerOutputId: action.payload.id
			};
		}

		case GRAPH_WORKER_OUTPUT: {
			const output: GraphWorkerOutput = action.payload;

			if (output.outputId !== state.expectedGraphWorkerOutputId) {
				// Graph is outdated, soon the next update will follow so we can skip this one
				return state;
			}

			return {
				...state,
				datasources: output.datasources
			};
		}

        default:
            return state;
    }
}
