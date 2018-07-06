import { webSocketSend } from '../connection/connectionActions';
import { datasourceDeactivated } from '../datasources/datasourcesActions';
import { Datasource } from '../datasources/interfaces/datasource';
import { Via } from '../graph/interfaces/via';
import { AppState } from '../main/interfaces/appState';
import {
	CREATE_NEW_CONNECTOR,
	DATE_FIELD_ADD,
	DATE_FIELD_DELETE, DELETE_FROM_CONNECTOR,
	FIELD_ADD,
	FIELD_DELETE,
	FIELD_UPDATE,
	FIELDS_CLEAR,
	FIELDS_RECEIVE,
	FIELDS_REQUEST,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY, UPDATE_RULE
} from './fieldsConstants';
import { Field } from './interfaces/field';
import { triggerGraphWorker } from '../graph/graphActions';
import { getGraphWorkerPayload } from '../graph/helpers/getGraphWorkerPayload';
import {
	MatchingStrategy,
	SimilarityAlgorithm
} from '../graph/interfaces/connector';
import { searchFieldsUpdate } from '../search/searchActions';
import { getConnectorRuleId } from './helpers/getConnectorRuleId';
import { getConnectorName } from './helpers/getConnectorName';

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

        const graphWorkerPayload = getGraphWorkerPayload(state);

        dispatch(triggerGraphWorker(graphWorkerPayload));

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

function dispatchAndRebuildGraph(action) {
    return (dispatch, getState) => {
        dispatch(action);
		dispatch(triggerGraphWorker(getGraphWorkerPayload(getState())));
    };
}

export function moveRuleBetweenConnectors(ruleId: string, fromConnectorName: string, toConnectorName: string) {
    return dispatchAndRebuildGraph({
		type: MOVE_RULE_BETWEEN_CONNECTORS,
		payload: {
			ruleId,
			fromConnectorName,
			toConnectorName
		}
	});
}

export function moveRuleToNewConnector(ruleId: string, fromConnectorName: string) {
    return dispatchAndRebuildGraph({
		type: MOVE_RULE_TO_NEW_CONNECTOR,
		payload: {
			ruleId,
			fromConnectorName
		}
	});
}

export function createNewConnector(field: Field) {
    return (dispatch, getState) => {
    	const state: AppState = getState();
    	const ruleId = getConnectorRuleId(state.fields.connectors);
    	const name = getConnectorName(state.fields.connectors);

        dispatch({
			type: CREATE_NEW_CONNECTOR,
			payload: {
				field,
				ruleId,
				name
			}
		});

        dispatch(searchFieldsUpdate());
    };
}

export function setMatchingStrategy(connectorName: string, matchingStrategy: MatchingStrategy) {
	return dispatchAndRebuildGraph({
		type: SET_MATCHING_STRATEGY,
		payload: {
			connectorName,
			matchingStrategy
		}
	});
}

export function deleteFromConnector(connectorName: string, ruleId: string) {
	return dispatchAndRebuildGraph({
		type: DELETE_FROM_CONNECTOR,
		payload: {
			connectorName,
			ruleId
		}
	});
}

export interface RuleProps {
	similarity?: number;
	similarityAlgorithm?: SimilarityAlgorithm;
}

export function updateRule(ruleId: string, props: RuleProps) {
	return dispatchAndRebuildGraph({
		type: UPDATE_RULE,
		payload: {
			ruleId,
			props
		}
	})
}