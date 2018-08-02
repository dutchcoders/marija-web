import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Datasource } from './interfaces/datasource';

export const getActiveNonLiveDatasources = createSelector(
	(state: AppState) => state.datasources.datasources,

	(datasources: Datasource[]): Datasource[] => datasources.filter(datasource =>
		datasource.active && datasource.type !== 'live'
	)
);

export const getNonLiveDatasources = createSelector(
	(state: AppState) => state.datasources.datasources,

	(datasources: Datasource[]): Datasource[] => datasources.filter(datasource =>
		datasource.type !== 'live'
	)
);

export const selectDatasourcesInData = createSelector(
	(state: AppState) => state.datasources.datasources,
	(state: AppState) => state.graph.items,

	(datasources, items): Datasource[] => {
		const active = new Map<string, true>();

		items.forEach(item => active.set(item.datasourceId, true));

		return datasources.filter(datasource =>
			active.has(datasource.id)
		);
	}
);