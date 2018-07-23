import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Field } from './interfaces/field';
import { Connector } from '../graph/interfaces/connector';
import { Datasource } from '../datasources/interfaces/datasource';
import { Item } from '../graph/interfaces/item';
import {
	getSuggestedConnectors,
	SuggestedConnector
} from './helpers/getSuggestedConnectors';

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

		const push = (field: Field) => {
			const existing = fields.find(search => search.path === field.path);

			if (!existing) {
				fields.push(field);
			}
		};

		connectors.forEach(connector =>
			connector.rules.forEach(rule =>
				push(rule.field)
			)
		);

		const getField = (path: string) => availableFields.find(search => search.path === path);

		datasources.forEach(datasource => {
			if (datasource.labelFieldPath) {
				const field = getField(datasource.labelFieldPath);

				if (field) {
					push(field);
				}
			}

			if (datasource.imageFieldPath) {
				const field = getField(datasource.imageFieldPath);

				if (field) {
					push(field);
				}
			}

			if (datasource.locationFieldPath) {
				const field = getField(datasource.locationFieldPath);

				if (field) {
					push(field);
				}
			}

			if (datasource.dateFieldPath) {
				const field = getField(datasource.dateFieldPath);

				if (field) {
					push(field);
				}
			}
		});

		return fields;
	}
);

export const getSelectedDateFields = createSelector(
	(state: AppState) => state.datasources.datasources,
	(state: AppState) => state.fields.availableFields,

	(datasources: Datasource[], fields: Field[]): Field[] => {
		const paths: string[] = [];

		datasources.forEach(datasource => {
			if (datasource.dateFieldPath) {
				paths.push(datasource.dateFieldPath);
			}
		});

		return fields.filter(field =>
			paths.indexOf(field.path) !== -1
		);
	}
);