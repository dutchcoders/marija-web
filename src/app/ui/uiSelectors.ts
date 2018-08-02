import { AppState } from '../main/interfaces/appState';
import { createSelector } from 'reselect';
import enMessages from '../../messages/en.json';
import nlMessages from '../../messages/nl.json';

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