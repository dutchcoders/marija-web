import {FIELDS_CLEAR, FIELDS_RECEIVE, FIELDS_REQUEST} from './fieldsConstants';
import sortFields from './helpers/sortFields';
import {Field} from './interfaces/field';
import {FieldsState} from "./interfaces/fieldsState";
import { Connector } from '../graph/interfaces/connector';
import {
	CREATE_NEW_CONNECTOR,
	DELETE_FROM_CONNECTOR,
	MOVE_FIELD_BETWEEN_CONNECTORS,
	MOVE_FIELD_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY
} from '../graph/graphConstants';
import { getIcon } from '../graph/helpers/getIcon';
import { getConnectorName } from './helpers/getConnectorName';

export const defaultFieldsState: FieldsState = {
    availableFields: [],
    fieldsFetching: false,
    defaultConfigs: {},
    connectors: []
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

		case MOVE_FIELD_BETWEEN_CONNECTORS: {
			const field = state.availableFields.find(field => field.path === action.payload.fieldPath);
			let connectors = state.connectors.concat([]);
			const fromConnectorIndex = connectors.findIndex(matcher => matcher.name === action.payload.fromConnectorName);
			const toConnectorIndex = connectors.findIndex(matcher => matcher.name === action.payload.toConnectorName);

			// Remove from the previous node matcher
			connectors[fromConnectorIndex] = {
				...connectors[fromConnectorIndex],
				fields: connectors[fromConnectorIndex].fields.filter(search => search.path !== field.path)
			};

			// If the previous node matcher doesnt have any fields left, delete it
			if (connectors[fromConnectorIndex].fields.length === 0) {
				connectors = connectors.filter(matcher => matcher.name !== connectors[fromConnectorIndex].name);
			}

			// Add to the next node matcher
			connectors[toConnectorIndex] = {
				...connectors[toConnectorIndex],
				fields: connectors[toConnectorIndex].fields.concat([field])
			};

			return {
				...state,
				connectors: connectors
			};
		}

		case MOVE_FIELD_TO_NEW_CONNECTOR: {
			const field = state.availableFields.find(field => field.path === action.payload.fieldPath);
			let connectors = state.connectors.concat([]);
			const fromConnectorIndex = connectors.findIndex(matcher => matcher.name === action.payload.fromConnectorName);

			// Remove from the previous node matcher
			connectors[fromConnectorIndex] = {
				...connectors[fromConnectorIndex],
				fields: connectors[fromConnectorIndex].fields.filter(search => search.path !== field.path)
			};

			// If the previous node matcher doesnt have any fields left, delete it
			if (connectors[fromConnectorIndex].fields.length === 0) {
				connectors = connectors.filter(matcher => matcher.name !== connectors[fromConnectorIndex].name);
			}

			// Add to the next node matcher
			const newMatcher: Connector = {
				name: getConnectorName(connectors),
				fields: [field],
				strategy: 'AND',
				icon: getIcon(field.path, state.connectors.map(matcher => matcher.icon))
			};

			return {
				...state,
				connectors: connectors.concat([newMatcher])
			};
		}

		case CREATE_NEW_CONNECTOR: {
			const field: Field = action.payload.field;

			const connector: Connector = {
				name: getConnectorName(state.connectors),
				fields: [field],
				strategy: 'AND',
				icon: getIcon(field.path, state.connectors.map(matcher => matcher.icon))
			};

			return {
				...state,
				connectors: state.connectors.concat([connector])
			};
		}

		case SET_MATCHING_STRATEGY: {
			const connectors = state.connectors.concat([]);
			const index = connectors.findIndex(matcher => matcher.name === action.payload.connectorName);

			connectors[index] = {
				...connectors[index],
				strategy: action.payload.matchingStrategy
			};

			return {
				...state,
				connectors: connectors
			};
		}

		case DELETE_FROM_CONNECTOR: {
			let connectors = state.connectors.concat([]);
			const index = connectors.findIndex(matcher => matcher.name === action.payload.connectorName);

			connectors[index] = {
				...connectors[index],
				fields: connectors[index].fields.filter(field => field.path !== action.payload.fieldPath)
			};

			// Delete the node matcher if there are no fields left
			if (connectors[index].fields.length === 0) {
				connectors = connectors.filter(matcher => matcher.name !== connectors[index].name);
			}

			return {
				...state,
				connectors: connectors
			};
		}

        default:
            return state;
    }
}
