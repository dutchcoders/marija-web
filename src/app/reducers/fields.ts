import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from '../modules/fields/index'
import { Socket } from '../utils/index';
import sortFields from "../helpers/sortFields";
import {Field} from "../interfaces/field";
import {uniqueId} from 'lodash';

interface State {
    availableFields: Field[];
    fieldsFetching: boolean;
}

const defaultState: State = {
    availableFields: [],
    fieldsFetching: false
};

export default function fields(state: State = defaultState, action) {
    switch (action.type) {
        case FIELDS_RECEIVE: {
            if (action.payload.fields === null) {
                return Object.assign({}, state, {
                    fieldsFetching: false
                });
            }

            const exists = (path: string): boolean => {
                const field: Field = state.availableFields.find(
                    search => search.path === path
                );

                return typeof field !== 'undefined';
            };

            const newFields: Field[] = action
                .payload
                .fields
                .filter(field => !exists(field.path))
                .map(field => {
                    field.datasourceId = action.payload.datasource;
                    return field;
                });

            let fields = state.availableFields.concat(newFields);
            fields = sortFields(fields);

            return Object.assign({}, state, {
                availableFields: fields,
                fieldsFetching: false
            });
        }

        case FIELDS_REQUEST:
            const datasources: string[] =  action.payload.indexes.map(datasource => datasource.id);

            Socket.ws.postMessage(
                {
                    datasources: datasources,
                    'request-id': uniqueId()
                },
                FIELDS_REQUEST
            );

            return Object.assign({}, state, {
                fieldsFetching: true
            });

        case FIELDS_CLEAR: {
            const fields = state.availableFields.filter(field =>
                field.datasourceId !== action.payload.datasource
            );

            return Object.assign({}, state, {
                availableFields: fields
            });
        }

        default:
            return state;
    }
}
