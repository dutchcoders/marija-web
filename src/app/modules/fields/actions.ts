import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from './index';
import {Datasource} from "../../interfaces/datasource";
import {Socket} from "../../utils";
import {uniqueId} from 'lodash';

export function clearFields(datasource){
    return {
        type: FIELDS_CLEAR,
        payload: {
            datasource: datasource
        }
    };
}

export function receiveFields(fields, datasource) {
    return {
        type: FIELDS_RECEIVE,
        payload: {
            fields: fields,
            datasource: datasource
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
