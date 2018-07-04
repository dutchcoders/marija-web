import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Field } from './interfaces/field';
import { Connector } from '../graph/interfaces/connector';
import { Datasource } from '../datasources/interfaces/datasource';

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

export const getSelectedFields = createSelector(
	(state: AppState) => state.fields.connectors,
	(state: AppState) => state.datasources.datasources,
	(state: AppState) => state.fields.availableFields,

	(connectors: Connector[], datasources: Datasource[], availableFields: Field[]) => {
		let fields: Field[] = [];

		connectors.forEach(matcher => fields = fields.concat(matcher.fields));

		const getField = (path: string) => availableFields.find(search => search.path === path);

		datasources.forEach(datasource => {
			if (datasource.labelFieldPath) {
				fields.push(getField(datasource.labelFieldPath));
			}

			if (datasource.imageFieldPath) {
				fields.push(getField(datasource.imageFieldPath));
			}

			if (datasource.locationFieldPath) {
				fields.push(getField(datasource.locationFieldPath));
			}
		});

		return fields;
	}
);