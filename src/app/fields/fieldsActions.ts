import { webSocketSend } from '../connection/connectionActions';
import { Datasource } from '../datasources/interfaces/datasource';
import { Via } from '../graph/interfaces/via';
import { AppState } from '../main/interfaces/appState';
import {
	CREATE_NEW_CONNECTOR,
	DELETE_FROM_CONNECTOR,
	FIELDS_RECEIVE,
	FIELDS_REQUEST,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY,
	UPDATE_CONNECTOR,
	UPDATE_RULE
} from './fieldsConstants';
import { Field } from './interfaces/field';
import { dispatchAndRebuildGraph, rebuildGraph } from '../graph/graphActions';
import { MatchingStrategy } from '../graph/interfaces/connector';
import { getConnectorName } from './helpers/getConnectorName';

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

export function createNewConnector(fields: Field[]) {
    return (dispatch, getState) => {
    	const state: AppState = getState();
    	const name = getConnectorName(state.fields.connectors);

        dispatch({
			type: CREATE_NEW_CONNECTOR,
			payload: {
				fields,
				name
			}
		});

        dispatch(rebuildGraph());
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

export interface ConnectorProps {
	color?: string;
	icon?: string;
}

export function updateConnector(connectorName: string, props: ConnectorProps) {
	return dispatchAndRebuildGraph({
		type: UPDATE_CONNECTOR,
		payload: {
			connectorName,
			props
		}
	})
}

export interface RuleProps {
	similarity?: number;
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