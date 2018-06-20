import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Field } from './interfaces/field';

export interface DateFieldGroups {
	[datasourceId: string]: Field[]
}

export const getDateFieldGroups = createSelector(
	(state: AppState) => state.fields.availableFields,

	(fields: Field[]): DateFieldGroups => {
		const dateFields = fields.filter(field => field.type === 'date');
		const groups: DateFieldGroups = {};

		dateFields.forEach(field => {
			if (!groups[field.datasourceId]) {
				groups[field.datasourceId] = [];
			}

			groups[field.datasourceId].push(field);
		});

		return groups;
	}
);
