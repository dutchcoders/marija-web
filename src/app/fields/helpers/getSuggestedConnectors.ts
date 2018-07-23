import { Item } from '../../graph/interfaces/item';
import { getValueSets } from '../../graph/helpers/getValueSets';
import { isEqual } from 'lodash';
import { Connector } from '../../graph/interfaces/connector';
import { doesConnectorExist } from './doesConnectorExist';
import {
	markPerformance,
	measurePerformance
} from '../../main/helpers/performance';

export interface SuggestedConnector {
	fields: string[];
	links: number;
	normalizedLinks: number;
	uniqueConnectors: number;
}

interface FakeConnector {
	sourceField: string;
	targetField: string;
}

interface FakeConnectorNode {
	fields: string[];
	itemIds: string[];
	value: any;
}

interface FieldStats {
	[field: string]: {
		values: number;
		uniqueValues: string[];
		valueLengths: number[];
	}
}

export function getSuggestedConnectors(items: Item[], existingConnectors: Connector[]): SuggestedConnector[] {
	markPerformance('suggestedStart');

	const fieldStats: FieldStats = {};
	const datasources: string[] = [];
	const subsetLength = 100;

	items.forEach(item => {
		if (datasources.indexOf(item.datasourceId) === -1) {
			datasources.push(item.datasourceId);
		}

		Object.keys(item.fields).forEach(key => {
			let values = item.fields[key];

			if (values === null || values === '' || typeof values === 'undefined') {
				return;
			}

			if (!Array.isArray(values)) {
				values = [values];
			}

			if (typeof fieldStats[key] === 'undefined') {
				fieldStats[key] = {
					values: 0,
					uniqueValues: [],
					valueLengths: []
				};
			}

			values.forEach(value => {
				fieldStats[key].values ++;

				if (fieldStats[key].uniqueValues.indexOf(value) === -1) {
					fieldStats[key].uniqueValues.push(value);
				}

				const string = '' + value;

				fieldStats[key].valueLengths.push(string.length);
			});
		});
	});

	const itemsPerDatasource = subsetLength / datasources.length;
	let subset: Item[] = [];

	// Take some items from all active datasources
	// We don't use all items for performance reasons
	datasources.forEach(datasource => {
		subset = subset.concat(items.filter(item =>
			item.datasourceId === datasource
		).slice(0, itemsPerDatasource));
	});

	let fields: string[] = [];
	Object.keys(fieldStats).forEach(field => {
		const stats = fieldStats[field];

		if (stats.uniqueValues.length === stats.values) {
			// All values are unique, this field is not useful
			return;
		}

		if (stats.uniqueValues.length === 1) {
			// All values are the same, this field is not useful
			return;
		}

		const averageLength = stats.valueLengths.reduce((prev, current) => prev + current, 0) / stats.valueLengths.length;

		if (averageLength > 100) {
			// The values in this field are too long, it's most likely not useful and it would be CPU intensive to try
			return;
		}

		fields.push(field);
	});

	const fakeConnectors: FakeConnector[] = [];
	let suggestedConnectors: SuggestedConnector[] = [];

	fields.forEach(sourceField => {
		fields.forEach(targetField => {
			const fields = [sourceField];

			if (targetField !== sourceField) {
				fields.push(targetField);
			}

			if (doesConnectorExist(fields, existingConnectors)) {
				return;
			}

			suggestedConnectors.push({
				fields,
				links: 0,
				normalizedLinks: 0,
				uniqueConnectors: 0
			});

			const existingFakeConnector = fakeConnectors.find(connector =>
				(connector.sourceField === sourceField && connector.targetField === targetField)
				&& (connector.sourceField === targetField && connector.targetField ===  sourceField)
			);

			if (typeof existingFakeConnector === 'undefined') {
				fakeConnectors.push({
					sourceField,
					targetField
				});
			}
		});
	});

	const done: any = {};
	const fakeConnectorNodes: FakeConnectorNode[] = [];

	const createFakeConnectorNode = (sourceField: string, targetField: string, value: any, itemIds: string[]) => {
		const existing = fakeConnectorNodes.find(connector =>
			connector.value === value
			&& connector.fields.indexOf(sourceField) !== -1
			&& connector.fields.indexOf(targetField) !== -1
		);

		if (existing) {
			itemIds.forEach(itemId => {
				if (existing.itemIds.indexOf(itemId) === -1) {
					existing.itemIds.push(itemId);
				}
			});

			return;
		}

		fakeConnectorNodes.push({
			fields: [sourceField, targetField],
			itemIds,
			value
		});
	};

	subset.forEach(sourceData => {
		const sourceValueSets = getValueSets(sourceData.fields, fields);

		sourceValueSets.forEach(sourceValueSet => {
			subset.forEach(targetData => {
				if (targetData.id === sourceData.id || done[sourceData.id + targetData.id]) {
					return;
				}

				done[targetData.id + sourceData.id] = true;
				done[sourceData.id + targetData.id] = true;

				const targetValueSets = getValueSets(targetData.fields, fields);

				targetValueSets.forEach(targetValueSet => {

					fakeConnectors.forEach(connector => {
						const sourceValue = sourceValueSet[connector.sourceField];
						const targetValue = targetValueSet[connector.targetField];

						if (sourceValue === targetValue) {
							createFakeConnectorNode(
								connector.sourceField,
								connector.targetField,
								sourceValue,
								[sourceData.id, targetData.id]
							);
						}
					});
				});
			});
		});
	});

	let maxLinks: number = 0;

	fakeConnectorNodes.forEach(connector => {
		const suggested = suggestedConnectors.find(search => {
			if (search.fields.length === 1) {
				return search.fields[0] === connector.fields[0] && search.fields[0] === connector.fields[1];
			}

			return isEqual(search.fields.sort(), connector.fields.sort())
		});

		suggested.links = suggested.links + connector.itemIds.length;
		suggested.uniqueConnectors ++;
		maxLinks = Math.max(suggested.links, maxLinks);
	});

	// Normalized values and calculate score
	const minUniqueConnectors = 2;
	const maxUniqueConnectors = .9 * items.length;

	suggestedConnectors = suggestedConnectors.filter(suggested =>
		suggested.uniqueConnectors <= maxUniqueConnectors
		&& suggested.uniqueConnectors >= minUniqueConnectors
	);

	suggestedConnectors.forEach(suggested => {
		suggested.normalizedLinks = suggested.links / maxLinks;
	});

	suggestedConnectors.sort((a, b) => b.normalizedLinks - a.normalizedLinks);

	markPerformance('suggestedEnd');
	measurePerformance('suggestedStart', 'suggestedEnd');

	return suggestedConnectors;
}