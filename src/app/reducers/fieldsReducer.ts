import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from '../modules/fields/index'
import sortFields from "../helpers/sortFields";
import {Field} from "../interfaces/field";
import {DefaultConfigs} from "../interfaces/defaultConfigs";

export interface FieldsState {
    availableFields: Field[];
    fieldsFetching: boolean;
    defaultConfigs: DefaultConfigs;
}

export const defaultFieldsState: FieldsState = {
    availableFields: [],
    fieldsFetching: false,
    defaultConfigs: {}
};

export default function fieldsReducer(state: FieldsState = defaultFieldsState, action) {
    switch (action.type) {
        case FIELDS_RECEIVE: {
            if (action.payload.fields === null) {
                return Object.assign({}, state, {
                    fieldsFetching: false
                });
            }

            const newFields: Field[] = action
                .payload
                .fields
                .map(field => {
                    field.datasourceId = action.payload.datasource;
                    return field;
                });

            let fields = state.availableFields
                .filter(field => field.datasourceId !== action.payload.datasource)
                .concat(newFields);

            fields = sortFields(fields);

            let defaultConfigs = state.defaultConfigs;

            if (action.payload.defaultFields || action.payload.defaultVia) {
                defaultConfigs = Object.assign({}, state.defaultConfigs, {
                    [action.payload.datasource]: {
                        fields: action.payload.defaultFields,
                        via: action.payload.defaultVia,
                    }
                });
            }

            return Object.assign({}, state, {
                availableFields: fields,
                fieldsFetching: false,
                defaultConfigs: defaultConfigs
            });
        }

        case FIELDS_REQUEST:
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
