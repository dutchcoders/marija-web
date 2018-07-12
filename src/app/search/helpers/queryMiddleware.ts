import { Middleware } from 'redux';
import { FIELDS_RECEIVE } from '../../fields/fieldsConstants';
import { INITIAL_STATE_RECEIVE } from '../../datasources/datasourcesConstants';
import Url from '../../main/helpers/url';
import { searchRequest } from '../searchActions';

let numDatasources: number;
let fieldsReceiveCount: number = 0;
let performedSearches: boolean = false;

export const queryMiddleware: Middleware = ({dispatch, getState}) => next => action => {
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
		// Now we're 'done'. We've received the necessary data from the server to begin searching.
		performedSearches = true;
		const state: any = getState();

		const active = state.datasources.datasources.filter(datasource =>
			datasource.active && datasource.type !== 'live'
		);

		// Check if there are some active datasources
		if (active.length > 0) {
			Url.getQueries().forEach(query =>
				dispatch(searchRequest(query))
			);
		} else {
			// Without active datasources we can remove the queries from the url,
			// because they have not been executed
			Url.getQueries().forEach(query =>
				Url.removeQuery(query)
			);
		}
	}

	return next(action);
};