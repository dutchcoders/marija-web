import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from './index';
import {Datasource} from "../../interfaces/datasource";
import {Socket} from "../../utils";
import {uniqueId} from 'lodash';
import {Field} from "../../interfaces/field";
import {Via} from "../../interfaces/via";

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
    const datasourceIds: string[] = datasources.map(datasource => datasource.id);

    Socket.ws.postMessage(
        {
            datasources: datasourceIds,
            'request-id': uniqueId()
        },
        FIELDS_REQUEST
    );

    return {
        type: FIELDS_REQUEST,
        payload: {
            datasources: datasources
        }
    };
}
