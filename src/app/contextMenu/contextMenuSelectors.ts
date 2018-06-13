import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';

export const isContextMenuActive = createSelector(
	(state: AppState) => state.contextMenu.nodeId,

	(nodeId: number): boolean => typeof nodeId !== 'undefined'
);