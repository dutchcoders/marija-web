import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from './index';
import {Datasource} from "../datasources/interfaces/datasource";
import {Field} from "./interfaces/field";
import {Via} from "../graph/interfaces/via";
import {webSocketSend} from "../../utils/utilsActions";

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
