import { Item } from '../../items/interfaces/item';
import { Link } from '../interfaces/link';
import { ChildData, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import {forEach, isEmpty, uniqueId, findIndex} from 'lodash';
import { Connector, MatchingStrategy } from '../interfaces/connector';
import { getValueSets, ValueSet } from './getValueSets';
import { Datasource } from '../../datasources/interfaces/datasource';

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

	const addDataToNode = (node: Node, itemId: string, valueSet): void => {
		forEach(valueSet, (value, key) => {
			if (node.childData[key]) {
				if (node.childData[key].indexOf(value) === -1) {
					node.childData[key].push(value);
				}
			} else {
				node.childData[key] = [value];
			}
		});

		if (node.items.indexOf(itemId) === -1) {
			node.items.push(itemId);
		}
	};

	const matchData = (data, valueSet: ValueSet, connector: Connector): boolean => {
		for (let i = 0; i < connector.fields.length; i ++) {
			const field = connector.fields[i].path;
			let values = data[field];

			if (typeof values === 'undefined') {
				if (connector.strategy === 'AND') {
					return false;
				}

				continue;
			}

			if (!Array.isArray(values)) {
				values = [values];
			}

			// Convert to strings
			values = values.map(value => value + '');

			const match = values.indexOf(valueSet[field]) !== -1;

			if (match && connector.strategy === 'OR') {
				return true;
			}

			if (!match && connector.strategy === 'AND') {
				return false;
			}
		}

		if (connector.strategy === 'OR') {
			return false;
		} else if (connector.strategy === 'AND') {
			return true;
		}
	};

	const getMatchingNodes = (valueSet: ValueSet, connector: Connector): Node[] => {
		return connectorNodes.filter(node => {
			return matchData(node.childData, valueSet, connector);
		});
	};

	const getMatchingItems = (itemId: string, valueSet, connector: Connector): Item[] => {
		return items.filter(item => {
			if (item.id === itemId) {
				return false;
			}

			if (deletedNodeIds.indexOf(getHash(item.id)) !== -1) {
				return false;
			}

			return matchData(item.fields, valueSet, connector);
		});
	};

    const createConnectorNodes = (itemId: string, valueSet, connector: Connector): Node[] => {
    	let matchingItems: Item[];

		matchingItems = getMatchingItems(itemId, valueSet, connector);

		let relevantMatches: Node[] = [];

    	matchingItems.forEach(item => {
    		const existing: Node[] = getMatchingNodes(valueSet, connector);

			if (existing.length > 0) {
    			existing.forEach(node => {
    				addDataToNode(node, item.id, valueSet);
				});

    			relevantMatches = relevantMatches.concat(existing);
    			return;
			}

			let name = '';
    		connector.fields.forEach(field => name += valueSet[field.path]);

			const hash = getHash(name);

			if (deletedNodeIds.indexOf(hash) !== -1) {
				return;
			}

			const node: Node = {
				id: hash,
				searchIds: [item.searchId],
				items: [item.id],
				count: item.count,
				name: name,
				abbreviated: abbreviateNodeName(name, item.searchId, 40),
				description: '',
				icon: connector.icon,
				fields: connector.fields.map(field => field.path),
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
				childData: valueSetToArrayValues(valueSet),
				connector: connector.name,
				type: 'connector',
				itemCount: item.count
			};

			connectorNodes.push(node);
			relevantMatches.push(node);
		});

    	return relevantMatches;
	};

    const createLink = (source: Node, target: Node, item: Item, color: number) => {
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
			directional: false
		});
	};

    const createItemNode = (item: Item): Node => {
    	const datasource = datasources.find(datasource => datasource.id === item.datasourceId);
    	const labelField = datasource && datasource.labelFieldPath ? datasource.labelFieldPath : Object.keys(item.fields)[0];
		const name = item.fields[labelField] || '';

		const imageField = datasource && datasource.imageFieldPath ? datasource.imageFieldPath : null;
    	let image: string;

    	if (imageField && item.fields[imageField]) {
    		image = item.fields[imageField];
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
			isGeoLocation: false,
			isImage: false,
			childData: item.fields,
			connector: null,
			type: 'item',
			datasourceId: item.datasourceId,
			image: image,
			itemCount: item.count
		};

    	itemNodes.push(node);

    	return node;
	};

    items.forEach(item => {
    	const sourceNode: Node = createItemNode(item);

    	if (sourceNode === null) {
    		// Maybe it was deleted by the user
    		return;
		}

		connectors.forEach(connector => {
			const data = {};

			connector.fields.forEach(field => {
				const value = item.fields[field.path];

				if (value) {
					data[field.path] = value;
				}
			});

			if (isEmpty(data)) {
				return;
			}

			const valueSets = getValueSets(data);

			valueSets.forEach(valueSet => {
				const targetNodes = createConnectorNodes(item.id, valueSet, connector);

				targetNodes.forEach(targetNode => {
					createLink(sourceNode, targetNode, item, connector.color);
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

	// console.log(nodes.map(node => [node.name]));
	// console.log(links.map(link => [
	// 	nodes.find(node => node.id === link.source).name,
	// 	nodes.find(node => node.id === link.target).name
	// ]));

	return {
        nodes: nodes,
        links: links
    };
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