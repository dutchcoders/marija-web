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

export const getNonDateFields = createSelector(
	(state: AppState) => state.fields.availableFields,

	(fields: Field[]) => fields.filter(field => field.type !== 'date')
);

export const getFieldsByDatasourceAndType = createSelector(
	(state: AppState) => state.fields.availableFields,
	(state: AppState, datasourceId: string) => datasourceId,
	(state: AppState, datasourceId: string, type: string) => type,

	(fields: Field[], datasourceId: string, type: string) => {
		if (datasourceId) {
			fields = fields.filter(field => field.datasourceId === datasourceId);
		}

		if (type) {
			fields = fields.filter(field => field.type === type);
		}

		return fields;
	}
);