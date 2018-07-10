import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Field } from './interfaces/field';
import { Connector } from '../graph/interfaces/connector';
import { Datasource } from '../datasources/interfaces/datasource';

export const getNonDateFields = createSelector(
	(state: AppState) => state.fields.availableFields,

	(fields: Field[]) => fields.filter(field => field.type !== 'date')
);

export const createGetFieldsByDatasourceAndType = () => createSelector(
	(state: AppState) => state.fields.availableFields,
	(state: AppState, datasourceId: string) => datasourceId,
	(state: AppState, datasourceId: string, types: string[]) => types,

	(fields: Field[], datasourceId: string, types: string[]) => {
		if (datasourceId) {
			fields = fields.filter(field => field.datasourceId === datasourceId);
		}

		if (types) {
			fields = fields.filter(field => types.indexOf(field.type) !== -1);
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

		connectors.forEach(connector =>
			connector.rules.forEach(rule =>
				fields.push(rule.field)
			)
		);

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

			if (datasource.dateFieldPath) {
				fields.push(getField(datasource.dateFieldPath));
			}
		});

		return fields;
	}
);