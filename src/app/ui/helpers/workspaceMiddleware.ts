import { Middleware } from 'redux';
import {
	CREATE_NEW_CONNECTOR,
	DATE_FIELD_ADD,
	DATE_FIELD_DELETE,
	DELETE_FROM_CONNECTOR,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR,
	SET_MATCHING_STRATEGY, UPDATE_CONNECTOR,
	UPDATE_RULE
} from '../../fields/fieldsConstants';
import {
	DATASOURCE_ACTIVATED,
	DATASOURCE_DEACTIVATED, UPDATE_DATASOURCE
} from '../../datasources/datasourcesConstants';
import { updateWorkspace } from '../uiActions';

let debouncer;

export const workspaceMiddleware: Middleware = ({dispatch}) => next => action => {
	const updateForActions: string[] = [
		MOVE_RULE_BETWEEN_CONNECTORS,
		MOVE_RULE_TO_NEW_CONNECTOR,
		CREATE_NEW_CONNECTOR,
		DELETE_FROM_CONNECTOR,
		SET_MATCHING_STRATEGY,
		UPDATE_RULE,
		DATE_FIELD_ADD,
		DATE_FIELD_DELETE,
		DATASOURCE_ACTIVATED,
		DATASOURCE_DEACTIVATED,
		UPDATE_DATASOURCE,
		UPDATE_CONNECTOR
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