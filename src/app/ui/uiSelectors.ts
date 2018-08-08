import { AppState } from '../main/interfaces/appState';
import { createSelector } from 'reselect';
import enMessages from '../../messages/en.json';
import nlMessages from '../../messages/nl.json';
import { WorkspaceDescription } from './interfaces/workspace';
import { CURRENT_WORKSPACE_VERSION } from './uiConstants';

export const selectMessages = createSelector(
	(state: AppState) => state.ui.lang,

	(lang) => {
		if (lang === 'en') {
			return enMessages;
		}

		if (lang === 'nl') {
			return nlMessages;
		}

		throw new Error('We dont have messages for language ' + lang);
	}
);

export const selectActiveWorkspaceDescription = createSelector(
	(state: AppState) => state.ui.workspaceDescriptions,
	(state: AppState) => state.ui.workspaceId,

	(workspaceDescriptions, workspaceId): WorkspaceDescription => {
		const description = workspaceDescriptions.find(description => description.id === workspaceId);

		if (description) {
			return description;
		}

		return workspaceDescriptions.find(description => description.id === '0');
	}
);

export const selectNonActiveWorkspaceDescriptions = createSelector(
	(state: AppState) => state.ui.workspaceDescriptions,
	(state: AppState) => state.ui.workspaceId,

	(workspaceDescriptions, workspaceId): WorkspaceDescription[] =>
		workspaceDescriptions.filter(description => description.id !== workspaceId)
);