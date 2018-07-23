import { Item } from '../../graph/interfaces/item';
import { getValueSets } from '../../graph/helpers/getValueSets';
import { isEqual } from 'lodash';
import { Connector } from '../../graph/interfaces/connector';
import { doesConnectorExist } from './doesConnectorExist';

interface HeatMapItem {
	links: number,
	normalized: number,
	targetField: string,
	score: number;
	uniqueConnectors: number;
}

export interface SuggestedConnector {
	fields: string[];
	links: number;
	normalizedLinks: number;
	uniqueConnectors: number;
}

export interface HeatMap {
	[sourceField: string]: HeatMapItem[]
}

interface FastData {
	id: any;
	fields: {
		[key: string]: any[]
	}
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

export function getSuggestedConnectors(items: Item[], existingConnectors: Connector[]): SuggestedConnector[] {
	let fields: string[] = [];

	items.forEach(item => {
		Object.keys(item.fields).forEach(key => {
			if (fields.indexOf(key) === -1) {
				fields.push(key);
			}
		});
	});

	// Convert items fields to numeric hashes for a performance boost
	const data: FastData[] = items.map(item => {
		const keys = Object.keys(item.fields);
		const itemData = {};

		keys.forEach(key => {
			let values = item.fields[key];

			if (!Array.isArray(values)) {
				values = [values];
			}

			itemData[key] = [];

			values.forEach(value => {
				if (typeof value === 'undefined' || value === null || value === '') {
					return;
				}

				// itemData[key].push(getNumericHash(value));
				itemData[key].push(value);
			});
		});

		return {
			// id: getNumericHash(item.id),
			id: item.id,
			fields: itemData
		};
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

	data.forEach(sourceData => {
		const sourceValueSets = getValueSets(sourceData.fields, fields);

		sourceValueSets.forEach(sourceValueSet => {
			data.forEach(targetData => {
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

	return suggestedConnectors;
}