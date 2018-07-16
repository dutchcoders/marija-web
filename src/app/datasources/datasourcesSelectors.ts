import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Datasource } from './interfaces/datasource';

export const getActiveNonLiveDatasources = createSelector(
	(state: AppState) => state.datasources.datasources,

	(datasources: Datasource[]): Datasource[] => datasources.filter(datasource =>
		datasource.active && datasource.type !== 'live'
	)
);