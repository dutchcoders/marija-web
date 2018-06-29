import fieldLocator from '../../fields/helpers/fieldLocator';
import { Field } from '../../fields/interfaces/field';
import { Item } from '../../items/interfaces/item';
import { Link } from '../interfaces/link';
import { ChildData, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import {forEach, isEmpty, uniqueId} from 'lodash';
import { NodeTemplate } from '../interfaces/nodeTemplate';
import { Util } from 'leaflet';
import { getValueSets } from './getValueSets';

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    nodeTemplates: NodeTemplate[],
    aroundNodeId: number | undefined = undefined,
    deletedNodes: Node[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    const links: Link[] = previousLinks.concat([]);

    const andMatcher = (valueSet, nodeTemplate: NodeTemplate): Node[] => {
    	return matcherNodes.filter(node => {
    		for (let i = 0; i < nodeTemplate.fields.length; i ++) {
    			const field = nodeTemplate.fields[i].path;
				const match = typeof node.childData[field] !== 'undefined' && node.childData[field].indexOf(valueSet[field]) !== -1;

				if (!match) {
					return false;
				}
			}

			return true;
		});
	};

    const orMatcher = (valueSet, nodeTemplate: NodeTemplate): Node[] => {
    	return matcherNodes.filter(node => {
    		for (let i = 0; i < nodeTemplate.fields.length; i ++) {
    			const field = nodeTemplate.fields[i].path;
				const match = typeof node.childData[field] !== 'undefined' && node.childData[field].indexOf(valueSet[field]) !== -1;

				if (match) {
					return true;
				}
			}

			return false;
		});
	};

    const addDataToNode = (node: Node, data): void => {
    	forEach(data, (value, key) => {
    		if (node.childData[key]) {
    			if (node.childData[key].indexOf(value) === -1) {
    				node.childData[key].push(value);
				}
			} else {
				node.childData[key] = [value];
			}
		});
	};

    const getMatchingItemsAnd = (itemId: string, valueSet, nodeTemplate: NodeTemplate): Item[] => {
		return items.filter(item => {
			if (item.id === itemId) {
				return false;
			}

			for (let i = 0; i < nodeTemplate.fields.length; i ++) {
				const field = nodeTemplate.fields[i].path;
				let itemValue = item.fields[field];

				if (typeof itemValue === 'undefined') {
					return false;
				}

				if (!Array.isArray(itemValue)) {
					itemValue = [itemValue];
				}

				const match = itemValue.indexOf(valueSet[field]) !== -1;

				if (!match) {
					return false;
				}
			}

			return true;
		});
	};

    const getMatchingItemsOr = (itemId: string, valueSet, nodeTemplate: NodeTemplate): Item[] => {
		return items.filter(item => {
			if (item.id === itemId) {
				return false;
			}

			for (let i = 0; i < nodeTemplate.fields.length; i ++) {
				const field = nodeTemplate.fields[i].path;
				let itemValue = item.fields[field];

				if (typeof itemValue !== 'undefined') {
					if (!Array.isArray(itemValue)) {
						itemValue = [itemValue];
					}

					const strings = itemValue.map(value => value + '');
					const match = strings.indexOf(valueSet[field]) !== -1;

					if (match) {
						return true;
					}
				}
			}

			return false;
		});
	};

    const getMatcherNodes = (itemId: string, valueSet, nodeTemplate: NodeTemplate): Node[] => {
    	let matchingItems: Item[];

    	if (nodeTemplate.matcher === 'AND') {
    		matchingItems = getMatchingItemsAnd(itemId, valueSet, nodeTemplate);
		} else {
    		matchingItems = getMatchingItemsOr(itemId, valueSet, nodeTemplate);
		}

		if (itemId === '3') {
    		console.log(matchingItems);
		}

		let relevantMatches: Node[] = [];

    	matchingItems.forEach(item => {
    		let existing: Node[] = [];

    		if (nodeTemplate.matcher === 'AND') {
    			existing = andMatcher(valueSet, nodeTemplate);
			} else {
    			existing = orMatcher(valueSet, nodeTemplate);
			}

			if (existing.length > 0) {
    			relevantMatches = relevantMatches.concat(existing);
    			return;
			}

			const name = uniqueId();
			const hash = getHash(name);

			const node: Node = {
				id: hash,
				searchIds: [item.searchId],
				items: [item.id],
				count: item.count,
				name: name,
				abbreviated: abbreviateNodeName(name, item.searchId, 40),
				description: '',
				icon: nodeTemplate.fields[0].icon,
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
				childData: valueSet,
				nodeTemplate: nodeTemplate.name
			};

			matcherNodes.push(node);
			relevantMatches.push(node);
		});

    	return relevantMatches;
	};

    const createLink = (source: Node, target: Node, item: Item) => {
		if (source.id === target.id) {
			// Nodes should not link to themselves
			return;
		}

		if (source.nodeTemplate === target.nodeTemplate) {
			// Dont create links between nodes of the same template
			// This would happen for fields with array values.
			// Creating links between those could be considered correct,
			// but it mainly makes things chaotic.
			// return;
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
			color: '#ccc',
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

    const itemNodes: Node[] = [];
    const matcherNodes: Node[] = [];

    const createItemNode = (item: Item): Node => {
    	const name = JSON.stringify(item.fields);
    	const hash = getHash(name);

    	const node: Node = {
			id: hash,
			searchIds: [item.searchId],
			items: [item.id],
			count: item.count,
			name: name,
			abbreviated: abbreviateNodeName(name, '', 40),
			description: '',
			icon: '',
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
			nodeTemplate: 'item'
		};

    	itemNodes.push(node);

    	return node;
	};

    items.forEach(item => {
    	const sourceNode: Node = createItemNode(item);

		nodeTemplates.forEach(nodeTemplate => {
			const data = {};

			nodeTemplate.fields.forEach(field => {
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
				const targetNodes = getMatcherNodes(item.id, valueSet, nodeTemplate);

				targetNodes.forEach(targetNode => {
					createLink(sourceNode, targetNode, item);
				});
			});
		});
	});

    const nodes = itemNodes.concat(matcherNodes);


	console.log(nodes.map(node => [node.name]));
	console.log(links.map(link => [
		nodes.find(node => node.id === link.source).name,
		nodes.find(node => node.id === link.target).name
	]));


	return {
        nodes: itemNodes.concat(matcherNodes),
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
