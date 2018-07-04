import { webSocketSend } from '../connection/connectionActions';
import { datasourceDeactivated } from '../datasources/datasourcesActions';
import { Datasource } from '../datasources/interfaces/datasource';
import { Via } from '../graph/interfaces/via';
import { AppState } from '../main/interfaces/appState';
import { DATE_FIELD_ADD, DATE_FIELD_DELETE, FIELD_ADD, FIELD_DELETE, FIELD_UPDATE, FIELDS_CLEAR, FIELDS_RECEIVE, FIELDS_REQUEST } from './fieldsConstants';
import { Field } from './interfaces/field';
import { triggerGraphWorker } from '../graph/graphActions';
import { getGraphWorkerPayload } from '../graph/helpers/getGraphWorkerPayload';
import {
	CREATE_NEW_CONNECTOR,
	DELETE_FROM_CONNECTOR,
	MOVE_FIELD_BETWEEN_CONNECTORS,
	MOVE_FIELD_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY
} from '../graph/graphConstants';
import { MatchingStrategy } from '../graph/interfaces/connector';
import { searchFieldsUpdate } from '../search/searchActions';

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

export function moveFieldBetweenConnectors(fieldPath: string, fromConnectorName: string, toConnectorName: string) {
    return dispatchAndRebuildGraph({
		type: MOVE_FIELD_BETWEEN_CONNECTORS,
		payload: {
			fieldPath,
			fromConnectorName,
			toConnectorName
		}
	});
}

export function moveFieldToNewConnector(fieldPath: string, fromConnectorName: string) {
    return dispatchAndRebuildGraph({
		type: MOVE_FIELD_TO_NEW_CONNECTOR,
		payload: {
			fieldPath,
			fromConnectorName
		}
	});
}

export function createNewConnector(field: Field) {
    return (dispatch, getState) => {
        dispatch({
			type: CREATE_NEW_CONNECTOR,
			payload: {
				field
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

export function deleteFromConnector(connectorName: string, fieldPath: string) {
	return dispatchAndRebuildGraph({
		type: DELETE_FROM_CONNECTOR,
		payload: {
			connectorName,
			fieldPath
		}
	});
}

