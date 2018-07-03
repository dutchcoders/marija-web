import fieldLocator from '../../fields/helpers/fieldLocator';
import { Field } from '../../fields/interfaces/field';
import { Item } from '../../items/interfaces/item';
import { Link } from '../interfaces/link';
import { ChildData, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import {forEach, isEmpty, uniqueId} from 'lodash';
import { NodeMatcher } from '../interfaces/nodeMatcher';
import { Util } from 'leaflet';
import { getValueSets } from './getValueSets';
import { Datasource } from '../../datasources/interfaces/datasource';

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    nodeMatchers: NodeMatcher[],
    aroundNodeId: number | undefined = undefined,
    deletedNodes: Node[] = [],
	datasources: Datasource[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    const links: Link[] = previousLinks.concat([]);
	const itemNodes: Node[] = previousNodes.filter(node => node.type === 'item');
	const intersections: Node[] = previousNodes.filter(node => node.type === 'intersection');

	const getDatasourceIcon = (datasourceId: string) => {
		const datasource = datasources.find(search => search.id === datasourceId);

		if (datasource) {
			return datasource.icon;
		}

		return '';
	};

    const andMatcher = (valueSet, nodeMatcher: NodeMatcher): Node[] => {
    	return intersections.filter(node => {
			for (let i = 0; i < nodeMatcher.fields.length; i ++) {
    			const field = nodeMatcher.fields[i].path;
				const match = typeof node.childData[field] !== 'undefined' && node.childData[field].indexOf(valueSet[field]) !== -1;

				if (!match) {
					return false;
				}
			}

			return true;
		});
	};

    const orMatcher = (valueSet, nodeMatcher: NodeMatcher): Node[] => {
    	return intersections.filter(node => {
    		for (let i = 0; i < nodeMatcher.fields.length; i ++) {
    			const field = nodeMatcher.fields[i].path;
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

    const getMatchingItemsAnd = (itemId: string, valueSet, nodeMatcher: NodeMatcher): Item[] => {
		return items.filter(item => {
			if (item.id === itemId) {
				return false;
			}

			for (let i = 0; i < nodeMatcher.fields.length; i ++) {
				const field = nodeMatcher.fields[i].path;
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

    const getMatchingItemsOr = (itemId: string, valueSet, nodeMatcher: NodeMatcher): Item[] => {
		return items.filter(item => {
			if (item.id === itemId) {
				return false;
			}

			for (let i = 0; i < nodeMatcher.fields.length; i ++) {
				const field = nodeMatcher.fields[i].path;
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

    const getMatcherNodes = (itemId: string, valueSet, nodeMatcher: NodeMatcher): Node[] => {
    	let matchingItems: Item[];

    	if (nodeMatcher.strategy === 'AND') {
    		matchingItems = getMatchingItemsAnd(itemId, valueSet, nodeMatcher);
		} else {
    		matchingItems = getMatchingItemsOr(itemId, valueSet, nodeMatcher);
		}

		let relevantMatches: Node[] = [];

    	matchingItems.forEach(item => {
    		let existing: Node[] = [];

    		if (nodeMatcher.strategy === 'AND') {
    			existing = andMatcher(valueSet, nodeMatcher);
			} else {
    			existing = orMatcher(valueSet, nodeMatcher);
			}

			if (existing.length > 0) {
    			relevantMatches = relevantMatches.concat(existing);
    			return;
			}

			let name = '';
    		nodeMatcher.fields.forEach(field => name += item.fields[field.path]);

			const hash = getHash(name);

			const node: Node = {
				id: hash,
				searchIds: [item.searchId],
				items: [item.id],
				count: item.count,
				name: name,
				abbreviated: abbreviateNodeName(name, item.searchId, 40),
				description: '',
				icon: nodeMatcher.fields[0].icon,
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
				nodeMatcher: nodeMatcher.name,
				type: 'intersection'
			};

			intersections.push(node);
			relevantMatches.push(node);
		});

    	return relevantMatches;
	};

    const createLink = (source: Node, target: Node, item: Item) => {
		if (source.id === target.id) {
			// Nodes should not link to themselves
			return;
		}

		if (source.nodeMatcher === target.nodeMatcher) {
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

    const createItemNode = (item: Item): Node => {
    	const name = item.fields[Object.keys(item.fields)[0]];
    	const hash = getHash(item.id);

    	const existing = itemNodes.find(node => node.id === hash);

    	if (typeof existing !== 'undefined') {
    		return existing;
		}

    	const node: Node = {
			id: hash,
			searchIds: [item.searchId],
			items: [item.id],
			count: item.count,
			name: name,
			abbreviated: abbreviateNodeName(name, '', 40),
			description: '',
			icon: getDatasourceIcon(item.datasourceId),
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
			nodeMatcher: null,
			type: 'item',
			datasourceId: item.datasourceId
		};

    	itemNodes.push(node);

    	return node;
	};

    items.forEach(item => {
    	const sourceNode: Node = createItemNode(item);

		nodeMatchers.forEach(nodeMatcher => {
			const data = {};

			nodeMatcher.fields.forEach(field => {
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
				const targetNodes = getMatcherNodes(item.id, valueSet, nodeMatcher);

				targetNodes.forEach(targetNode => {
					createLink(sourceNode, targetNode, item);
				});
			});
		});
	});

    const nodes = itemNodes.concat(intersections);

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
