import { TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, FIELD_ADD, FIELD_UPDATE, FIELD_DELETE, DATE_FIELD_ADD, DATE_FIELD_DELETE, NORMALIZATION_ADD, NORMALIZATION_DELETE, INITIAL_STATE_RECEIVE } from './index';
import {VIA_ADD, VIA_DELETE} from "./constants";
import {Field} from "../../interfaces/field";
import {getFields} from '../fields/actions';
import {Datasource} from "../../interfaces/datasource";
import {datasourceDeactivated} from "../datasources/actions";

export function tableColumnRemove(field) {
    return {
        type: TABLE_COLUMN_REMOVE,
        receivedAt: Date.now(),
        field: field
    };
}

export function tableColumnAdd(field) {
    return {
        type: TABLE_COLUMN_ADD,
        receivedAt: Date.now(),
        field: field
    };
}

export function dateFieldAdd(field: Field) {
    return {
        type: DATE_FIELD_ADD,
        receivedAt: Date.now(),
        field: field
    };
}

export function dateFieldDelete(field: Field) {
    return {
        type: DATE_FIELD_DELETE,
        receivedAt: Date.now(),
        field: field
    };
}

export function fieldAdd(field) {
    return {
        type: FIELD_ADD,
        receivedAt: Date.now(),
        field: field
    };
}

export function fieldUpdate(fieldPath: string, updates: any) {
    return {
        type: FIELD_UPDATE,
        receivedAt: Date.now(),
        fieldPath: fieldPath,
        updates: updates
    };
}

export function fieldDelete(field) {
    return (dispatch, getState) => {
        dispatch({
            type: FIELD_DELETE,
            receivedAt: Date.now(),
            field: field
        });

        const state = getState();
        const fields: Field[] = state.entries.fields;
        const datasources: Datasource[] = state.datasources.datasources;

        datasources.forEach(datasource => {
            if (!datasource.active) {
                return;
            }

            const datasourceFields = fields.filter(field =>
                field.datasourceId === datasource.id
            );

            if (datasourceFields.length === 0) {
                // If there are no more active fields for this datasource,
                // deactivate the datasource
                dispatch(datasourceDeactivated(datasource));
            }
        });
    };
}

export function normalizationAdd(normalization) {
    return {
        type: NORMALIZATION_ADD,
        receivedAt: Date.now(),
        normalization: normalization
    };
}

export function normalizationDelete(normalization) {
    return {
        type: NORMALIZATION_DELETE,
        receivedAt: Date.now(),
        normalization: normalization
    };
}

export function receiveInitialState(initialState) {
    return (dispatch, getState) => {
        dispatch({
            type: INITIAL_STATE_RECEIVE,
            receivedAt: Date.now(),
            initial_state: initialState
        });

        console.log(initialState.datasources);

        const datasources = initialState.datasources.filter((datasource: Datasource) =>
            datasource.type !== 'live'
            && datasource.type !== 'elasticsearch'
        );

        dispatch(getFields(datasources));
    };
}

export function viaAdd(via) {
    return {
        type: VIA_ADD,
        receivedAt: Date.now(),
        via: via
    };
}

export function viaDelete(via) {
    return {
        type: VIA_DELETE,
        receivedAt: Date.now(),
        via: via
    };
}