import { Item } from '../interfaces/item';
import { Link } from '../interfaces/link';
import { GeoLocation, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import { Connector, Rule } from '../interfaces/connector';
import { getValueSets, ValueSet } from './getValueSets';
import { Datasource } from '../../datasources/interfaces/datasource';
import { getStringSimilarityLevenshtein } from './getStringSimilarityLevenshtein';
import { getNumericHash } from './getNumericHash';
import { getHaversineDistance } from './getHaversinceDistance';

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    connectors: Connector[],
    aroundNodeId: number | undefined = undefined,
    deletedNodeIds: number[] = [],
	datasources: Datasource[] = []
): {
    nodes: Node[],
    links: Link[]
} {
	items = items.filter(item => item.display);

    const links = new Map<number, Link>();
    previousLinks.forEach(link => links.set(link.hash, link));

    const itemNodes = new Map<number, Node>();
	previousNodes.forEach(node => {
		if (node.type === 'item') {
			itemNodes.set(node.id, node);
		}
	});

	const connectorNodes: Node[] = previousNodes.filter(node => node.type === 'connector');

    const createLink = (source: Node, target: Node, item: Item, color: string) => {
		if (source.id === target.id) {
			// Nodes should not link to themselves
			return;
		}

		const hash = source.id + target.id;
    	const existing = links.get(hash);

    	if (existing) {
    		// Link already exists
    		return;
		}

		links.set(hash, {
			hash: hash,
			source: source.id,
			target: target.id,
			color: color,
			total: 1,
			current: 1,
			display: true,
			viaId: null,
			replacedNode: null,
			directional: false,
			highlighted: false
		});
	};

    const createItemNode = (item: Item): Node => {
		const hash = getNumericHash(item.id);
		const existing = itemNodes.get(hash);

    	const datasource = datasources.find(datasource => datasource.id === item.datasourceId);
		let name: string = '';

		if (datasource.labelFieldPath && item.fields[datasource.labelFieldPath]) {
			name = item.fields[datasource.labelFieldPath];

			if (Array.isArray(name)) {
				name = name.join(', ');
			}
		}

		const imageField = datasource && datasource.imageFieldPath ? datasource.imageFieldPath : null;
    	let image: string;

    	if (imageField && item.fields[imageField]) {
    		image = item.fields[imageField];
		}

		const locationField = datasource && datasource.locationFieldPath ? datasource.locationFieldPath : null;
		let location: GeoLocation;
		let isGeoLocation: boolean = false;

		if (locationField && item.fields[locationField]) {
			isGeoLocation = true;
			const parts = item.fields[locationField].split(',');
			location = {
				lat: parseFloat(parts[0]),
				lng: parseFloat(parts[1]),
			};
		}

    	if (existing) {
    		if (name !== existing.name) {
    			return {
					...existing,
					name: name
				};
			}

			if (image !== existing.image) {
    			return {
					...existing,
					image: image
				};
			}

			if (location !== existing.geoLocation) {
				return {
					...existing,
					geoLocation: location
				};
			}

    		return existing;
		}

		if (deletedNodeIds.indexOf(hash) !== -1) {
			return null;
		}

    	const node: Node = {
			id: hash,
			searchIds: [item.searchId],
			items: [item.id],
			count: item.count,
			name: name,
			abbreviated: abbreviateNodeName(name, '', 40),
			description: '',
			icon: datasource ? datasource.icon : '',
			fields: [],
			hash: hash,
			selected: false,
			highlightLevel: null,
			displayTooltip: false,
			important: false,
			isGeoLocation: isGeoLocation,
			isImage: false,
			childData: valueSetToArrayValues(item.fields),
			connector: null,
			type: 'item',
			datasourceId: item.datasourceId,
			image: image,
			geoLocation: location
		};

    	itemNodes.set(hash, node);

    	return node;
	};

    const addDataToConnectorNode = (node: Node, match: ArrayValueSet, items: Item[]) => {
    	items.forEach(item => {
    		if (node.items.indexOf(item.id) === -1) {
    			node.items.push(item.id);
			}
		});

    	const keys: string[] = Object.keys(match);

    	keys.forEach(key => {
    		if (node.childData[key]) {
    			match[key].forEach(matchValue => {
					if (node.childData[key].indexOf(matchValue) === -1) {
						node.childData[key].push(matchValue);
					}
				})
			} else {
    			node.childData[key] = match[key];
			}
		});
	};

    const createConnectorNode = (match: ArrayValueSet, connector: Connector, items: Item[]): Node[] => {
    	// Check if a connector node already exists that matches this value set
		const targetValueSets = getValueSets(match, Object.keys(match));
		const fields = connector.rules.map(rule => rule.field.path);

    	const existing: Node[] = connectorNodes.filter(node => {
    		const valueSets = getValueSets(node.childData, fields);

    		for (let i = 0; i < valueSets.length; i ++) {
    			for (let j = 0; j < targetValueSets.length; j ++) {
					const matches = matchValueSets(targetValueSets[j], valueSets[i], connector);

					if (matches.length > 0) {
						return true;
					}
				}
			}

    		return false;
		});

    	if (existing.length > 0) {
    		// If there is an existing connector that matches this value set,
			// add the data of the new items to it
    		existing.forEach(node => {
				addDataToConnectorNode(node, match, items);
			});

    		return existing;
		}

		const names: string[] = connector.rules.reduce((prev: string[], rule: Rule) => {
			const value = match[rule.field.path];

			if (value === null || typeof value === 'undefined') {
				return prev;
			}

			return prev.concat([value.join(', ')]);
		}, []);

		const name = names.join(', ');
    	const hash = getNumericHash(name);

		const node: Node = {
			id: hash,
			searchIds: items.map(item => item.searchId),
			items: items.map(item => item.id),
			count: 1,
			name: name,
			abbreviated: abbreviateNodeName(name, items[0].searchId, 40),
			description: '',
			icon: connector.icon,
			fields: fields,
			hash: hash,
			selected: false,
			highlightLevel: null,
			displayTooltip: false,
			important: false,
			isGeoLocation: false,
			isImage: false,
			childData: match,
			connector: connector.name,
			type: 'connector',
		};

		connectorNodes.push(node);

		return [node];
	};

    const done = new Map<string, true>();

    const getValueSetKey = (item: Item, fields: string[]): string => {
		return item.id + '-' + fields.join(',');
	};

    // Prepare all the value sets, so we don't need to do it inside the loop
    const valueSets = new Map<string, ValueSet[]>();
    items.forEach(item => {
    	connectors.forEach(connector => {
    		const fields = connector.rules.map(rule => rule.field.path);
			const key = getValueSetKey(item, fields);

			valueSets.set(key, getValueSets(item.fields, fields));
		});
	});

    items.forEach(sourceItem => {
    	const sourceNode: Node = createItemNode(sourceItem);

    	if (sourceNode === null) {
    		// Maybe it was deleted by the user
    		return;
		}

		items.forEach(targetItem => {
			// Item should not link to itself
			if (targetItem.id === sourceItem.id || done.has(sourceItem.id + targetItem.id)) {
				return;
			}

			// Make sure we don't compare the same items again, but then in the opposite direction
			done.set(sourceItem.id + targetItem.id, true);
			done.set(targetItem.id + sourceItem.id, true);

			const targetNode: Node = createItemNode(targetItem);

			if (targetNode === null) {
				// Maybe it was deleted by the user
				return;
			}

			connectors.forEach(connector => {
				const fields = connector.rules.map(rule => rule.field.path);
				const sourceValueSets = valueSets.get(getValueSetKey(sourceItem, fields));
				const targetValueSets = valueSets.get(getValueSetKey(targetItem, fields));

				sourceValueSets.forEach(sourceValueSet => {
					targetValueSets.forEach(targetValueSet => {

    					const matches = matchValueSets(sourceValueSet, targetValueSet, connector);


						matches.forEach(match => {
							const newConnectorNodes = createConnectorNode(match, connector, [sourceItem, targetItem]);

							newConnectorNodes.forEach(connectorNode => {
								createLink(sourceNode, connectorNode, sourceItem, connector.color);
								createLink(targetNode, connectorNode, targetItem, connector.color);
							});
						});
    				});
				});
			});
		});
	});

	setConnectorRadius(connectorNodes);
	itemNodes.forEach(node => node.r = getItemRadius(node));

    const nodes = Array.from(itemNodes.values()).concat(connectorNodes);

	// console.log('items:', itemNodes.map(node => [node.items.join(','), node.childData]));
	// console.log('connectors:', connectorNodes.map(node => node.childData));
	// console.log('links: ', links.map(link => {
	// 	const source = nodes.find(node => node.id === link.source);
	// 	const target = nodes.find(node => node.id === link.target);
	//
	// 	return [
	// 		source.items.join(',') + '-' + source.name,
	// 		target.items.join(',') + '-' + JSON.stringify(target.childData),
	// 	];
	// }));

	return {
        nodes: nodes,
        links: Array.from(links.values())
    };
}

interface ArrayValueSet {
	[key: string]: string[];
}

function matchValueSets(a: ValueSet, b: ValueSet, connector: Connector): ArrayValueSet[] {
	if (connector.rules.length === 1) {
		const rule = connector.rules[0];
		const field = rule.field.path;

		if ((typeof rule.similarity === 'undefined' || rule.similarity === 100) && (typeof rule.distance === 'undefined' || rule.distance === 0)) {
			if (a[field] === b[field]) {
				return [{
					[field]: [a[field]]
				}];
			} else {
				return [];
			}
		}
	}

	if (connector.strategy === 'AND') {
		const match = matchValueSetsAnd(a, b, connector);

		if (match) {
			return [match];
		}

		return [];
	} else {
		return matchValueSetsOr(a, b, connector);
	}
}

function matchValueSetsAnd(a: ValueSet, b: ValueSet, connector: Connector): ArrayValueSet | false {
	const match: any = {};

	for (let i = 0; i < connector.rules.length; i ++) {
		const rule = connector.rules[i];
		const field = rule.field.path;


		if (typeof a[field] === 'undefined'
			|| typeof b[field] === 'undefined') {
			return false;
		}

		if (typeof rule.similarity === 'number' && rule.similarity < 100) {
			if (getStringSimilarityLevenshtein(a[field], b[field]) < rule.similarity) {
				return false;
			}
		} else if (typeof rule.distance === 'number' && rule.distance > 0) {
			const distance = getHaversineDistance(a[field], b[field]);

			if (distance > rule.distance) {
				return false;
			}
		} else if (a[field] !== b[field]) {
			return false;
		}

		match[field] = [a[field]];

		if (a[field] !== b[field]) {
			match[field].push(b[field]);
		}
	}

	return match;
}

function matchValueSetsOr(a: ValueSet, b: ValueSet, connector: Connector): ArrayValueSet[] {
	const matches: any = [];

	connector.rules.forEach(sourceRule => {
		const sourceField = sourceRule.field.path;

		connector.rules.forEach(targetRule => {
			const targetField = targetRule.field.path;

			if (typeof a[sourceField] === 'undefined'
				|| typeof b[targetField] === 'undefined') {
				return;
			}

			let similarity: number;
			if (typeof sourceRule.similarity === 'number' && sourceRule.similarity) {
				similarity = sourceRule.similarity;
			}

			if (typeof targetRule.similarity === 'number' && targetRule.similarity) {
				if (typeof similarity === 'undefined' || targetRule.similarity < similarity) {
					// Choose the lowest similarity from the target and source rule
					similarity = targetRule.similarity;
				}
			}

			let distance: number;
			if (typeof sourceRule.distance === 'number' && sourceRule.distance && typeof targetRule.distance === 'number' && targetRule.distance) {
				distance = Math.min(sourceRule.distance, targetRule.distance);
			}

			let match: boolean;

			if (typeof similarity !== 'undefined' && similarity < 100) {
				match = getStringSimilarityLevenshtein(a[sourceField], b[targetField]) >= similarity;
			} else if (typeof distance !== 'undefined' && distance > 0) {
				match = getHaversineDistance(a[sourceField], b[targetField]) <= distance;
			} else {
				match = a[sourceField] === b[targetField];
			}

			if (match) {
				const matchObject = {
					[sourceField]: [a[sourceField]]
				};

				if (a[sourceField] !== b[targetField]) {
					matchObject[sourceField].push(b[targetField]);
				}

				matches.push(matchObject);
			}
		});
	});

	return matches;
}

function getItemRadius(node: Node): number {
	if (node.isImage) {
		return 30;
	}

	return 15;
}

function valueSetToArrayValues(valueSet: ValueSet) {
	const keys = Object.keys(valueSet);
	const newObject = {};

	keys.forEach(key => {
		let value = valueSet[key];

		if (value === null || value === '') {
			return;
		}

		if (Array.isArray(value)) {
			newObject[key] = value;
		} else {
			newObject[key] = [value];
		}
	});

	return newObject;
}

function setConnectorRadius(connectors: Node[]) {
	const minRadius = 15;
	const maxRadius = 30;
	const rangeRadius = maxRadius - minRadius;

	const minItems = connectors.reduce((prev: number, node: Node) =>
		Math.min(prev, node.items.length), 9999
	);

	const maxItems = connectors.reduce((prev: number, node: Node) =>
		Math.max(prev, node.items.length), 0
	);

	const rangeItems = maxItems - minItems;

	connectors.forEach(node => {
		if (rangeItems === 0) {
			node.r = minRadius;
		} else {
			const relative = (node.items.length - minItems) / rangeItems;
			node.r = relative * rangeRadius + minRadius;
		}
	});
}