import {
	CREATE_NEW_CONNECTOR, DELETE_FROM_CONNECTOR,
	FIELDS_CLEAR,
	FIELDS_RECEIVE,
	FIELDS_REQUEST,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY
} from './fieldsConstants';
import sortFields from './helpers/sortFields';
import {Field} from './interfaces/field';
import {FieldsState} from "./interfaces/fieldsState";
import { Connector } from '../graph/interfaces/connector';
import { getIcon } from '../graph/helpers/getIcon';
import { getConnectorName } from './helpers/getConnectorName';
import { getConnectorColor } from './helpers/getConnectorColor';

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

		case MOVE_RULE_BETWEEN_CONNECTORS: {
			const ruleId: string = action.payload.ruleId;
			let connectors = state.connectors.concat([]);
			const fromConnectorIndex = connectors.findIndex(connector => connector.name === action.payload.fromConnectorName);
			const toConnectorIndex = connectors.findIndex(connector => connector.name === action.payload.toConnectorName);
			const rule = connectors[fromConnectorIndex].rules.find(rule => rule.id === ruleId);

				// Remove from the previous connector
			connectors[fromConnectorIndex] = {
				...connectors[fromConnectorIndex],
				rules: connectors[fromConnectorIndex].rules.filter(rule => rule.id !== ruleId)
			};

			// If the previous connector doesnt have any rules left, delete it
			if (connectors[fromConnectorIndex].rules.length === 0) {
				connectors = connectors.filter(matcher => matcher.name !== connectors[fromConnectorIndex].name);
			}

			// Add to the next connector
			connectors[toConnectorIndex] = {
				...connectors[toConnectorIndex],
				rules: connectors[toConnectorIndex].rules.concat([rule])
			};

			return {
				...state,
				connectors: connectors
			};
		}

		case MOVE_RULE_TO_NEW_CONNECTOR: {
			const ruleId: string = action.payload.ruleId;
			let connectors = state.connectors.concat([]);
			const fromConnectorIndex = connectors.findIndex(matcher => matcher.name === action.payload.fromConnectorName);
			const rule = connectors[fromConnectorIndex].rules.find(rule => rule.id === ruleId);

			// Remove from the previous connector
			connectors[fromConnectorIndex] = {
				...connectors[fromConnectorIndex],
				rules: connectors[fromConnectorIndex].rules.filter(search => search.id !== ruleId)
			};

			// If the previous connector doesnt have any fields left, delete it
			if (connectors[fromConnectorIndex].rules.length === 0) {
				connectors = connectors.filter(matcher => matcher.name !== connectors[fromConnectorIndex].name);
			}

			// Add to the next connector
			const newMatcher: Connector = {
				name: getConnectorName(connectors),
				rules: [rule],
				strategy: 'AND',
				icon: getIcon(rule.field.path, state.connectors.map(matcher => matcher.icon)),
				color: getConnectorColor(connectors)
			};

			return {
				...state,
				connectors: connectors.concat([newMatcher])
			};
		}

		case CREATE_NEW_CONNECTOR: {
			const field: Field = action.payload.field;
			const name: string = action.payload.name;
			const ruleId: string = action.payload.ruleId;

			const connector: Connector = {
				name: name,
				rules: [{
					id: ruleId,
					field: field
				}],
				strategy: 'AND',
				icon: getIcon(field.path, state.connectors.map(matcher => matcher.icon)),
				color: getConnectorColor(state.connectors)
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
				rules: connectors[index].rules.filter(rule => rule.id !== action.payload.ruleId)
			};

			// Delete the connector if there are no rules left
			if (connectors[index].rules.length === 0) {
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
