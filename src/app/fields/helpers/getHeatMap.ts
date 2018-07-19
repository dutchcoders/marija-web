import { Item } from '../../graph/interfaces/item';
import { getValueSets } from '../../graph/helpers/getValueSets';

interface HeatMapItem {
	links: number,
	normalized: number,
	targetField: string
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

export function getHeatMap(items: Item[]): HeatMap {
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
	const heatMap: HeatMap = {};

	fields.forEach(sourceField => {
		heatMap[sourceField] = [];

		fields.forEach(targetField => {
			heatMap[sourceField].push({
				targetField,
				normalized: 0,
				links: 0
			});

			const existing = fakeConnectors.find(connector =>
				(connector.sourceField === sourceField && connector.targetField === targetField)
				&& (connector.sourceField === targetField && connector.targetField ===  sourceField)
			);

			if (typeof existing === 'undefined') {
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
		const source = heatMap[connector.fields[0]];
		const target = source.find(item => item.targetField === connector.fields[1]);

		target.links = target.links + connector.itemIds.length;
		maxLinks = Math.max(target.links, maxLinks);
	});

	// Do the reverse heat map
	Object.keys(heatMap).forEach(sourceField => {
		heatMap[sourceField].forEach(item => {
			const oppositeSource = heatMap[item.targetField];
			const oppositeTarget = oppositeSource.find(search => search.targetField === sourceField);

			oppositeTarget.links = item.links;
		});
	});

	// Normalized values
	Object.keys(heatMap).forEach(sourceField => {
		heatMap[sourceField].forEach(target => {
			target.normalized = target.links / maxLinks;
		});
	});

	return heatMap;
}