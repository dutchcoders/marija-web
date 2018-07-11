import { Item } from '../../items/interfaces/item';
import { Link } from '../interfaces/link';
import { ChildData, GeoLocation, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import {forEach, isEmpty, uniqueId, findIndex, isEqual} from 'lodash';
import { Connector, MatchingStrategy, Rule } from '../interfaces/connector';
import { getValueSets, ValueSet } from './getValueSets';
import { Datasource } from '../../datasources/interfaces/datasource';
import { getStringSimilarityLevenshtein } from './getStringSimilarityLevenshtein';
import { getStringSimilaritySsdeep } from './getStringSimilaritySsdeep';

const contents = [];

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
    const links: Link[] = previousLinks.concat([]);
	const itemNodes: Node[] = previousNodes.filter(node => node.type === 'item');
	const connectorNodes: Node[] = previousNodes.filter(node => node.type === 'connector');

	// Proof that items with the same fields sometimes have a different ID
	// items.forEach(item => {
	// 	const stringified = JSON.stringify(item.fields);
	//
	// 	const content = contents.find(content => content.stringified === stringified);
	//
	// 	if (content && content.id !== item.id) {
	// 		console.error('Original', content, ' New', item);
	// 	} else {
	// 		contents.push({
	// 			id: item.id,
	// 			stringified
	// 		});
	// 	}
	// });

    const createLink = (source: Node, target: Node, item: Item, color: string) => {
		if (source.id === target.id) {
			// Nodes should not link to themselves
			return;
		}

		const hash = source.id + target.id;

    	const existing = links.findIndex(link => link.hash === hash);

    	if (existing !== -1) {
    		const newLink = {
				...links[existing]
			};

    		if (newLink.itemIds.indexOf(item.id) === -1) {
    			newLink.itemIds = newLink.itemIds.concat([item.id]);
			}

			links[existing] = newLink;

    		return;
		}

		links.push({
			hash: hash,
			source: source.id,
			target: target.id,
			color: color,
			total: 1,
			current: 1,
			normalizationIds: [],
			display: true,
			isNormalizationParent: false,
			viaId: null,
			replacedNode: null,
			itemIds: [item.id],
			directional: false,
			highlighted: false
		});
	};

    const createItemNode = (item: Item): Node => {
    	const datasource = datasources.find(datasource => datasource.id === item.datasourceId);
    	const labelField = datasource && datasource.labelFieldPath ? datasource.labelFieldPath : Object.keys(item.fields)[0];
		let name = item.fields[labelField] || '';

		if (Array.isArray(name)) {
			name = name.join(', ');
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

		const hash = getHash(item.id);

    	const existing = itemNodes.find(node => node.id === hash);

    	if (typeof existing !== 'undefined') {
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
			normalizationId: null,
			display: true,
			selected: false,
			highlighted: false,
			displayTooltip: false,
			isNormalizationParent: false,
			important: false,
			isGeoLocation: isGeoLocation,
			isImage: false,
			childData: item.fields,
			connector: null,
			type: 'item',
			datasourceId: item.datasourceId,
			image: image,
			itemCount: item.count,
			geoLocation: location
		};

    	itemNodes.push(node);

    	return node;
	};

    const createConnectorNode = (match: ValueSet, connector: Connector, items: Item[]): Node => {
    	const existing: Node = connectorNodes.find(node => {
    		const valueSets = getValueSets(node.childData);

    		for (let i = 0; i < valueSets.length; i ++) {
    			const matches = matchValueSets(match, valueSets[i], connector);

    			if (matches.length > 0) {
    				return true;
				}
			}

    		return false;
		});

    	if (existing) {
    		return existing;
		}

		const names: string[] = connector.rules.reduce((prev: string[], rule: Rule) => {
			const value = match[rule.field.path];

			if (value === null || typeof value === 'undefined') {
				return prev;
			}

			return prev.concat([value]);
		}, []);

		const name = names.join(', ');
    	const hash = getHash(name);

		const node: Node = {
			id: hash,
			searchIds: items.map(item => item.searchId),
			items: items.map(item => item.id),
			count: 1,
			name: name,
			abbreviated: abbreviateNodeName(name, items[0].searchId, 40),
			description: '',
			icon: connector.icon,
			fields: connector.rules.map(rule => rule.field.path),
			hash: hash,
			normalizationId: null,
			display: true,
			selected: false,
			highlighted: false,
			displayTooltip: false,
			isNormalizationParent: false,
			important: false,
			isGeoLocation: false,
			isImage: false,
			childData: valueSetToArrayValues(match),
			connector: connector.name,
			type: 'connector',
			itemCount: items[0].count
		};

		connectorNodes.push(node);

		return node;
	};

    items.forEach(sourceItem => {
    	const sourceNode: Node = createItemNode(sourceItem);

    	if (sourceNode === null) {
    		// Maybe it was deleted by the user
    		return;
		}

		const sourceValueSets = getValueSets(sourceItem.fields);

    	sourceValueSets.forEach(sourceValueSet => {
    		items.forEach(targetItem => {
    			// Item should not link to itself
    			if (targetItem.id === sourceItem.id) {
    				return;
				}

    			const targetValueSets = getValueSets(targetItem.fields);

				targetValueSets.forEach(targetValueSet => {

    				connectors.forEach(connector => {
    					const matches = matchValueSets(sourceValueSet, targetValueSet, connector);

						matches.forEach(match => {
							const connectorNode = createConnectorNode(match, connector, [sourceItem, targetItem]);

							createLink(sourceNode, connectorNode, sourceItem, connector.color);
						});
    				});
				});
			});
		});
	});

    const minCount: number = itemNodes.reduce((prev: number, current: Node) => {
    	return Math.min(prev, current.itemCount);
	}, 999999);

	const maxCount: number = itemNodes.reduce((prev: number, current: Node) => {
		return Math.max(prev, current.itemCount);
	}, 1);

    const nodes = itemNodes.concat(connectorNodes);

	nodes.forEach(node => node.r = getNodeRadius(node, minCount, maxCount));

	// console.log(nodes.map(node => [node.type, node.name, node.childData]));
	// console.log(connectorNodes.map(node => node.childData));
	//
	// console.log(links.map(link => [
	// 	nodes.find(node => node.id === link.source).name,
	// 	nodes.find(node => node.id === link.target).name
	// ]));

	return {
        nodes: nodes,
        links: links
    };
}

function matchValueSets(a: ValueSet, b: ValueSet, connector: Connector): ValueSet[] {
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

function matchValueSetsAnd(a: ValueSet, b: ValueSet, connector: Connector): ValueSet | false {
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
		} else {
			if (a[field] !== b[field]) {
				return false;
			}
		}

		match[field] = a[field];
	}

	return match;
}

function matchValueSetsOr(a: ValueSet, b: ValueSet, connector: Connector): ValueSet[] {
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

			let match: boolean;

			if (typeof similarity !== 'undefined') {
				match = getStringSimilarityLevenshtein(a[sourceField], b[targetField]) >= similarity;
			} else {
				match = a[sourceField] === b[targetField];
			}

			if (match) {
				matches.push({
					[sourceField]: a[sourceField]
				});
			}
		});
	});

	return matches;
}

export function getHash(string) {
	let hash = 0, i, chr;
	string += '';
	string = string.toLowerCase();

	if (string.length === 0) {
		return hash;
	}

	for (i = 0; i < string.length; i++) {
		chr   = string.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

function getNodeRadius(node: Node, minCount: number, maxCount: number): number {
	if (node.type === 'connector') {
		return 15;
	}

	let minRadius = 15;
	const maxRadius = 40;

	if (node.isImage) {
		minRadius = 30;
	}

	return Math.min(
		maxRadius,
		minRadius + (node.itemCount - minCount) / Math.max(1, (maxCount - minCount)) * (maxRadius - minRadius)
	);
}

function valueSetToArrayValues(valueSet) {
	const keys = Object.keys(valueSet);
	const newObject = {};

	keys.forEach(key => {
		newObject[key] = [valueSet[key]];
	});

	return newObject;
}