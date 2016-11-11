import { FIELDS_RECEIVE, FIELDS_REQUEST } from '../modules/fields/index'

import { concat, without, map, filter, union, reduce, merge } from 'lodash'
import { Fields } from '../domain/index'

import { Socket } from '../utils/index';

const defaultState = {
    availableFields: []
};

export default function fields(state = defaultState, action) {
    switch (action.type) {
        case FIELDS_RECEIVE:
            const fields = Fields.getFieldsFromResult(action.payload.fields);
            const newAvailableFields = Fields.extractNewFields(fields, state.availableFields);

            return Object.assign({}, state, {availableFields: state.availableFields.concat(newAvailableFields)});

        case FIELDS_REQUEST:
            Socket.ws.postMessage(
                {
                    host: action.payload.host
                },
                FIELDS_REQUEST
            );
            return state;
        default:
            return state;
    }
}