import {FIELDS_CLEAR, FIELDS_RECEIVE, FIELDS_REQUEST} from './index';
import {Datasource} from "../datasources/interfaces/datasource";
import {Field} from "./interfaces/field";
import {Via} from "../graph/interfaces/via";
import {webSocketSend} from "../../utils/utilsActions";
import {
    DATE_FIELD_ADD,
    DATE_FIELD_DELETE,
    FIELD_ADD,
    FIELD_DELETE,
    FIELD_UPDATE
} from "./fieldsConstants";
import {AppState} from "../../interfaces/appState";
import {datasourceDeactivated} from "../datasources/datasourcesActions";

export function clearFields(datasource){
    return {
        type: FIELDS_CLEAR,
        payload: {
            datasource: datasource
        }
    };
}

export function receiveFields(fields: Field[], datasource: string, defaultFields: Field[], defaultVia: Via[]) {
    return {
        type: FIELDS_RECEIVE,
        payload: {
            fields: fields,
            datasource: datasource,
            defaultFields: defaultFields,
            defaultVia: defaultVia
        }
    };
}

export function getFields(datasources: Datasource[]) {
    return (dispatch, getState) => {
        dispatch({
            type: FIELDS_REQUEST,
            payload: {
                datasources: datasources
            }
        });

        const datasourceIds: string[] = datasources.map(datasource => datasource.id);

        dispatch(webSocketSend({
            type: FIELDS_REQUEST,
            datasources: datasourceIds
        }));
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

        const state: AppState = getState();
        const fields: Field[] = state.graph.fields;
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
                dispatch(datasourceDeactivated(datasource.id));
            }
        });
    };
}

