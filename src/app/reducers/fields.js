import { FIELDS_RECEIVE, FIELDS_REQUEST } from '../modules/fields/index'

import { concat, without, map, filter, union, reduce, merge } from 'lodash'

import { Socket } from '../utils/index';

const defaultState = {
    availableFields: []
};

const defaultType = '_default_';

function addToArray(array, item) {
    array.push(item);
    return array;
}

function recurseFields(type, fieldsContainer, base, fields = []) {

    let foundFields = [];
    let shouldExtract = false;

    if (typeof fieldsContainer.properties === 'object') {
        shouldExtract = 'properties';
    }

    if (typeof fieldsContainer.fields === 'object') {
        shouldExtract = 'fields';
    }

    if (shouldExtract) {
        const fields = Object.keys(fieldsContainer[shouldExtract]);

        foundFields = reduce(fields, (results, field) => {
            const innerFields = recurseFields(type, fieldsContainer[shouldExtract][field], field, []);

            return addToArray(concat(innerFields, results), {
                name: base ? [base, field].join('.') : field,
                document_type: type,
                type: fieldsContainer[shouldExtract][field].type,
                format: fieldsContainer[shouldExtract][field].format || null
            });
        }, []);
    }

    return merge(fields, foundFields);
}

export default function fields(state = defaultState, action) {
    switch (action.type) {
        case FIELDS_RECEIVE:
            const fields = reduce(action.payload.fields, (results, field) => {
                const types = filter(Object.keys(field.mappings), (type) => {
                    return type !== defaultType;
                });

                const discoveredFields = reduce(types, (perType, type) => {
                    return perType.concat(recurseFields(type, field.mappings[type], ''));
                }, []);

                return results.concat(discoveredFields);
            }, []);


            const newAvailableFields = reduce(fields, (allFields, newItem) => {
                if (typeof state.availableFields.find((item) => item.name === newItem.name) == 'undefined') {
                    allFields.push(newItem);
                }

                return allFields;
            }, []);

            return Object.assign({}, state, { availableFields: state.availableFields.concat(newAvailableFields)});

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