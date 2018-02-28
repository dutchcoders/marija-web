import { DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED } from '../modules/datasources/index';
import { union, without, uniqBy } from 'lodash';
import {Datasource} from "../interfaces/datasource";
import {INITIAL_STATE_RECEIVE} from "../modules/data/index";
import {Socket} from "../utils";

interface State {
    datasources: Datasource[];
}

export const defaultDatasourcesState: State = {
    datasources: []
};

export default function datasources(state: State = defaultDatasourcesState, action) {
    switch (action.type) {
        case INITIAL_STATE_RECEIVE: {
            const datasources: Datasource[] = action.initial_state.datasources.map(datasource => {
                const existing = state.datasources.find(search => search.id === datasource.id);

                return {
                    id: datasource.id,
                    name: datasource.name,
                    active: typeof existing === 'undefined' ? false : existing.active
                };
            });

            return Object.assign({}, state, {
                datasources: datasources
            });
        }
        case DATASOURCE_ACTIVATED: {
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasource);

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
            const index: number = state.datasources.findIndex(datasource => datasource.id === action.payload.datasource);

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

        default:
            return state;
    }
}
