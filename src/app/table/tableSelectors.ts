import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { sortItems } from '../graph/helpers/sortItems';

export const selectSortedItems = createSelector(
	(state: AppState) => state.graph.items,
	(state: AppState) => state.table.sortColumn,
	(state: AppState) => state.table.sortType,

	(items, sortColumn, sortType) => sortItems(items, sortColumn, sortType)
);