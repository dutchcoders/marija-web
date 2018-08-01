import { Middleware } from 'redux';
import {
	CREATE_NEW_CONNECTOR,
	DELETE_FROM_CONNECTOR,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY, UPDATE_CONNECTOR,
	UPDATE_RULE
} from '../../fields/fieldsConstants';
import {
	CREATE_CUSTOM_DATASOURCE,
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED, DELETE_CUSTOM_DATASOURCE, UPDATE_DATASOURCE
} from '../../datasources/datasourcesConstants';
import { updateWorkspace } from '../uiActions';
import {
	SET_AUTOMATICALLY_CREATE_CONNECTORS,
	SET_FILTER_BORING_NODES,
	SET_FILTER_SECONDARY_QUERIES
} from '../../graph/graphConstants';
import { SET_EXPERIMENTAL_FEATURES, SET_PANE_CONFIG } from '../uiConstants';
import { SEARCH_REQUEST } from '../../search/searchConstants';

let debouncer;

export const workspaceMiddleware: Middleware = ({dispatch}) => next => action => {
	const updateForActions: string[] = [
		MOVE_RULE_BETWEEN_CONNECTORS,
		MOVE_RULE_TO_NEW_CONNECTOR,
		CREATE_NEW_CONNECTOR,
		DELETE_FROM_CONNECTOR,
		SET_MATCHING_STRATEGY,
		UPDATE_RULE,
		DATASOURCE_ACTIVATED,
		DATASOURCE_DEACTIVATED,
		UPDATE_DATASOURCE,
		UPDATE_CONNECTOR,
		SET_FILTER_SECONDARY_QUERIES,
		SET_FILTER_BORING_NODES,
		SET_PANE_CONFIG,
		CREATE_CUSTOM_DATASOURCE,
		DELETE_CUSTOM_DATASOURCE,
		SET_EXPERIMENTAL_FEATURES,
		SET_AUTOMATICALLY_CREATE_CONNECTORS,
		SEARCH_REQUEST
	];

	if (updateForActions.indexOf(action.type) !== -1) {
		clearTimeout(debouncer);
		debouncer = setTimeout(
			() => dispatch(updateWorkspace()),
			3000
		);
	}

	return next(action);
};