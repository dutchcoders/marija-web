import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from './index';
import {Datasource} from "../../interfaces/datasource";
import {INITIAL_STATE_RECEIVE} from "../data/index";
import {SEARCH_DELETE} from '../search/constants';
import {Search} from "../../interfaces/search";

export interface DatasourcesState {
    datasources: Datasource[];
}

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
                    type: datasource.type
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

        default:
            return state;
    }
}
