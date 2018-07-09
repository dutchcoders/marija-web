import { Middleware } from 'redux';
import { FIELDS_RECEIVE } from '../../fields/fieldsConstants';
import { INITIAL_STATE_RECEIVE } from '../../datasources/datasourcesConstants';
import Url from '../../main/helpers/url';
import { searchRequest } from '../searchActions';

let numDatasources: number;
let fieldsReceiveCount: number = 0;
let performedSearches: boolean = false;

export const queryMiddleware: Middleware = ({dispatch}) => next => action => {
	if (action.type === INITIAL_STATE_RECEIVE) {
		const normalDatasources = action.initial_state.datasources.filter(datasource =>
			datasource.type !== 'live'
		);

		numDatasources = normalDatasources.length;
	}

	if (action.type === FIELDS_RECEIVE) {
		fieldsReceiveCount ++;
	}

	if (numDatasources === fieldsReceiveCount && !performedSearches) {
		performedSearches = true;

		// Now we're 'done'. We've received the necessary data from the server to begin searching.
		Url.getQueries().forEach(query =>
			dispatch(searchRequest(query))
		);
	}

	return next(action);
};