import { createSelector } from 'reselect';
import { AppState } from '../main/interfaces/appState';
import { Field } from './interfaces/field';
import { Connector } from '../graph/interfaces/connector';
import { Datasource } from '../datasources/interfaces/datasource';
import { getFieldStats } from './helpers/getFieldStats';

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

const selectFieldsInData = createSelector(
	(state: AppState) => state.fields.availableFields,
	(state: AppState) => state.graph.items,

	(fields, items): Field[] => {
		const active = new Map<string, true>();

		items.forEach(item => {
			Object.keys(item.fields).forEach(field => {
				active.set(item.datasourceId + '-' + field, true);
			});
		});

		return fields.filter(field =>
			active.has(field.datasourceId + '-' + field.path)
		);
	}
);

export interface TypeLabel {
	label: string,
	types: string[];
}

export const selectTypeLabels = createSelector(
	(state: AppState) => selectFieldsInData(state),

	(fields): TypeLabel[] => {
		const typeLabelOptions: TypeLabel[] = [
			{
				label: 'yes/no',
				types: ['boolean']
			},
			{
				label: 'date',
				types: ['date']
			},
			{
				label: 'text',
				types: ['text', 'keyword']
			},
			{
				label: 'number',
				types: ['long', 'double', 'int']
			},
			{
				label: 'location',
				types: ['geo_point']
			},
		];

		const types = [];

		fields.forEach(field => {
			if (types.indexOf(field.type) === -1) {
				types.push(field.type);
			}
		});

		const activeTypeLabels: TypeLabel[] = [];
		types.forEach(type => {
			const alreadyUsed = activeTypeLabels.reduce((prev, item) => prev.concat(item.types), []);

			if (alreadyUsed.indexOf(type) !== -1) {
				return;
			}

			const typeLabel = typeLabelOptions.find(search => search.types.indexOf(type) !== -1);

			if (typeLabel) {
				activeTypeLabels.push(typeLabel);
			} else {
				activeTypeLabels.push({
					label: type,
					types: [type]
				});
			}
		});

		return [{
			label: 'all types',
			types: []
		}].concat(activeTypeLabels);
	}
);

export const selectFieldList = createSelector(
	(state: AppState, query: string, types: string[], datasourceId: string) => selectFieldsInData(state),
	(state: AppState, query: string, types: string[], datasourceId: string) => query,
	(state: AppState, query: string, types: string[], datasourceId: string) => types,
	(state: AppState, query: string, types: string[], datasourceId: string) => datasourceId,

	(fields, query, types, datasourceId): Field[] => {
		if (query) {
			fields = fields.filter(field => field.path.includes(query));
		}

		if (types.length) {
			fields = fields.filter(field => types.indexOf(field.type) !== -1);
		}

		if (datasourceId) {
			fields = fields.filter(field => field.datasourceId === datasourceId);
		}

		return fields;
	}
);

export const selectFieldStats = createSelector(
	(state: AppState) => state.fields.availableFields,
	(state: AppState) => state.graph.items,

	(fields, items) => getFieldStats(fields, items)
);