import { FIELDS_RECEIVE, FIELDS_REQUEST, FIELDS_CLEAR } from './index';


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

export function getFields(indexes) {
    return {
        type: FIELDS_REQUEST,
        payload: {
            indexes: indexes
        }
    };
}
