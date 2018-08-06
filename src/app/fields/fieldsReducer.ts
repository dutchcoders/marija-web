import {
	CREATE_NEW_CONNECTOR, DELETE_CONNECTOR, DELETE_FROM_CONNECTOR,
	FIELDS_RECEIVE,
	FIELDS_REQUEST,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR, SET_FIELD_COUNT_IN_GRAPH_WORKER,
	SET_MATCHING_STRATEGY, UPDATE_CONNECTOR, UPDATE_RULE
} from './fieldsConstants';
import sortFields from './helpers/sortFields';
import {Field} from './interfaces/field';
import {FieldsState} from "./interfaces/fieldsState";
import { Connector } from '../graph/interfaces/connector';
import { getIcon } from '../graph/helpers/getIcon';
import { getConnectorName } from './helpers/getConnectorName';
import { getConnectorColor } from './helpers/getConnectorColor';
import { ConnectorProps, RuleProps } from './fieldsActions';
import { RECEIVE_WORKSPACE } from '../ui/uiConstants';
import { Workspace } from '../ui/interfaces/workspace';
import { createConnector } from './helpers/createConnector';
import {
	GRAPH_WORKER_OUTPUT,
	SET_AUTOMATICALLY_CREATE_CONNECTORS, SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID
} from '../graph/graphConstants';
import { GraphWorkerOutput } from '../graph/helpers/graphWorkerClass';
import { DELETE_CUSTOM_DATASOURCE } from '../datasources/datasourcesConstants';
import { Datasource } from '../datasources/interfaces/datasource';

export const defaultFieldsState: FieldsState = {
    availableFields: [],
    fieldsFetching: false,
    defaultConfigs: {},
    connectors: [],
	suggestedConnectors: [],
	deletedConnectorFields: [],
	expectedGraphWorkerOutputId: null,
	fieldCountInGraphWorker: 0
};

export default function fieldsReducer(state: FieldsState = defaultFieldsState, action): FieldsState {
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


		case MOVE_RULE_BETWEEN_CONNECTORS: {
			const ruleId: string = action.payload.ruleId;
			let connectors = state.connectors.concat([]);
			const fromConnectorIndex = connectors.findIndex(connector => connector.name === action.payload.fromConnectorName);

			if (fromConnectorIndex === -1) {
				throw new Error('FromConnector ' + action.payload.fromConnectorName + ' not found');
			}

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

			const toConnectorIndex = connectors.findIndex(connector => connector.name === action.payload.toConnectorName);

			if (toConnectorIndex === -1) {
				throw new Error('ToConnector ' + action.payload.toConnectorName + ' not found');
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
			const fields: Field[] = action.payload.fields;
			const name: string = action.payload.name;
			const connector = createConnector(state.connectors, name, fields);

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

			if (index === -1) {
				throw new Error('Trying to delete not-existing connector: ' + action.payload.connectorName);
			}

			const fieldPath = connectors[index].rules.find(rule => rule.id === action.payload.ruleId).field.path;

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
				connectors: connectors,
				deletedConnectorFields: state.deletedConnectorFields.concat([fieldPath])
			};
		}

		case DELETE_CONNECTOR: {
			const connector = state.connectors.find(matcher => matcher.name === action.payload.connectorName);
			const fieldPaths = connector.rules.map(rule => rule.field.path);
			const connectors = state.connectors.filter(matcher => matcher.name !== connector.name);

			return {
				...state,
				connectors: connectors,
				deletedConnectorFields: state.deletedConnectorFields.concat(fieldPaths)
			};
		}

		case UPDATE_RULE: {
			const ruleId: string = action.payload.ruleId;
			const props: RuleProps = action.payload.props;
			const connectors = state.connectors.concat([]);
			let ruleIndex: number;

			const connectorIndex = connectors.findIndex(connector => {
				return connector.rules.findIndex((rule, index) => {
					const found: boolean = rule.id === ruleId;

					if (found) {
						ruleIndex = index;
					}

					return found;
				}) !== -1;
			});

			const rules = connectors[connectorIndex].rules.concat([]);
			rules[ruleIndex] = {
				...rules[ruleIndex],
				...props
			};

			connectors[connectorIndex] = {
				...connectors[connectorIndex],
				rules: rules
			};

			return {
				...state,
				connectors: connectors
			};
		}

		case UPDATE_CONNECTOR: {
			const name: string = action.payload.connectorName;
			const props: ConnectorProps = action.payload.props;
			const connectors = state.connectors.concat([]);
			const index = connectors.findIndex(connector => connector.name === name);

			connectors[index] = {
				...connectors[index],
				...props
			};

			return {
				...state,
				connectors: connectors
			}
		}

		case RECEIVE_WORKSPACE: {
			const workspace: Workspace = action.payload.workspace;

			return {
				...state,
				connectors: workspace.connectors,
				availableFields: workspace.availableFields
			}
		}

		case GRAPH_WORKER_OUTPUT: {
			const output: GraphWorkerOutput = action.payload;

			if (output.outputId !== state.expectedGraphWorkerOutputId) {
				// Graph is outdated, soon the next update will follow so we can skip this one
				return state;
			}

			const newState: FieldsState = {
				...state,
				connectors: output.connectors
			};

			if (output.suggestedConnectors) {
				newState.suggestedConnectors = output.suggestedConnectors;
			}

			return newState;
		}

		case DELETE_CUSTOM_DATASOURCE: {
			const datasource: Datasource = action.payload.datasource;

			return {
				...state,
				availableFields: state.availableFields.filter(field => field.datasourceId !== datasource.id)
			};
		}

		case SET_AUTOMATICALLY_CREATE_CONNECTORS: {
			if (action.payload.enabled) {
				// Reset the deleted connectors when user explicitly says to automatically create connectors again
				return {
					...state,
					deletedConnectorFields: []
				};
			}

			return state;
		}

		case SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID: {
			return {
				...state,
				expectedGraphWorkerOutputId: action.payload.id
			};
		}

		case SET_FIELD_COUNT_IN_GRAPH_WORKER: {
			return {
				...state,
				fieldCountInGraphWorker: action.payload.count
			};
		}

        default:
            return state;
    }
}
