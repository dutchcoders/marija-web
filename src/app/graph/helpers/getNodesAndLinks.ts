import fieldLocator from '../../fields/helpers/fieldLocator';
import { Field } from '../../fields/interfaces/field';
import { Item } from '../../items/interfaces/item';
import { Link } from '../interfaces/link';
import { ChildData, Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';
import {forEach} from 'lodash';

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    fields: Field[],
    aroundNodeId: number | undefined = undefined,
    deletedNodes: Node[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    const parentNodeMap = new Map<number, Node>();
    previousNodes.forEach(node => parentNodeMap.set(node.id, node));

	const childNodeMap = new Map<number, Node[]>();
	previousNodes.forEach(node => {
		forEach(node.childData, values => {
			values.forEach(value => {
				childNodeMap.set(getHash(value), [node]);
			})
		});
	});

    const linkMap = new Map<number, Link>();
    previousLinks.forEach(link => linkMap.set(link.hash, link));

    const deletedMap = new Map<string, true>();
    deletedNodes.forEach(node => deletedMap.set(node.name, true));

    const getParentOrChildNodes = (hash: number): Node[] => {
    	const parent = parentNodeMap.get(hash);

    	if (parent) {
    		return [parent];
		}

		return childNodeMap.get(hash);
	};

    const createNode = (name: string, field: Field, item: Item): string[] => {
    	let activeField: Field;
    	let childData: ChildData;
    	const linkables: string[] = [];

    	if (field.childOf) {
			childData = {
				[field.path]: [name]
			};

			const existingNodes = getParentOrChildNodes(getHash(name));

			if (existingNodes) {
				existingNodes.forEach(existing => {
					if (existing && existing.fields.indexOf(field.childOf) !== -1) {
						linkables.push(existing.name);

						addDataToNode(existing, item, childData);
					}
				});
			}

			name = fieldLocator(item.fields, field.childOf);

			if (typeof name === 'undefined') {
				return [];
			}

			activeField = fields.find(search =>
				search.path === field.childOf
			);

		} else {
    		activeField = field;
    		childData = {};
		}

		if (name) {
			linkables.push(name);
		}

		const hash = getHash(name);

    	if (parentNodeMap.has(hash)) {
    		const node = parentNodeMap.get(hash);

    		addDataToNode(node, item, childData);
			return linkables;
		}

		const node: Node = {
			id: hash,
			searchIds: [item.searchId],
			items: [item.id],
			count: item.count,
			name: name,
			abbreviated: abbreviateNodeName(name, item.searchId, 40),
			description: '',
			icon: activeField.icon,
			fields: [activeField.path],
			hash: hash,
			normalizationId: null,
			display: true,
			selected: false,
			highlighted: false,
			displayTooltip: false,
			isNormalizationParent: false,
			important: false,
			isGeoLocation: activeField.type === 'location',
			isImage: activeField.type === 'image',
			childData: childData
		};

		parentNodeMap.set(hash, node);

		return linkables;
	};

    const addDataToNode = (node: Node, item: Item, childData?: ChildData): void => {
		if (node.items.indexOf(item.id) === -1) {
			node.items.push(item.id);
		}

		if (node.searchIds.indexOf(item.searchId) === -1) {
			node.searchIds.push(item.searchId);
		}

		forEach(childData, (values, key) => {
			values.forEach(value => {
				if (node.childData[key]) {
					if (node.childData[key].indexOf(value) === -1) {
						node.childData[key].push(value)
					}
				} else {
					node.childData[key] = [value];
				}

				const hash = getHash(value);
				const nodeSet = childNodeMap.get(hash);

				if (nodeSet) {
					if (typeof nodeSet.find(search => search.id === node.id) === 'undefined') {
						nodeSet.push(node);
					}
				} else {
					childNodeMap.set(hash, [node]);
				}
			});
		});
	};

    items.forEach(item => {
        fields.forEach(sourceField => {
            const sourceValues = getIterableFieldValues(fieldLocator(item.fields, sourceField.path), deletedMap);

            sourceValues.forEach(sourceValue => {
                const linkableSources = createNode(sourceValue, sourceField, item);

				linkableSources.forEach(linkableSource => {
					fields.forEach(targetField => {
						let targetValues = getIterableFieldValues(fieldLocator(item.fields, targetField.path), deletedMap);

						targetValues.forEach(targetValue => {
							const linkableTargets = createNode(targetValue, targetField, item);

							linkableTargets.forEach(linkableTarget => {
								if (sourceValues.length > 1) {
									// we don't want all individual arrays to be linked together
									// those individual arrays being linked are (I assume) irrelevant
									// otherwise this needs to be a configuration option
									return;
								}

								// Dont create links from a node to itself
								if (linkableSource === linkableTarget) {
									return;
								}

								const linkExists = (key: number): boolean => {
									if (!linkMap.has(key)) {
										// Link does not exist
										return false;
									}

									// If the link already exists, save the item id to the
									// existing link, so we can keep track of which items
									// are associated with which links. We can use that to
									// determine line thickness.

									const existingLink = linkMap.get(key);

									if (existingLink.itemIds.indexOf(item.id) === -1) {
										existingLink.itemIds = existingLink.itemIds.concat([item.id]);
									}

									return true;
								};

								const sourceHash = getHash(linkableSource);
								const targetHash = getHash(linkableTarget);
								const linkHash = sourceHash + targetHash;

								if (linkExists(linkHash)) {
									return;
								}

								let label: string;

								if (linkableTarget !== targetValue) {
									label = targetValue.substring(0, 15);
								}

								// Create new link
								linkMap.set(linkHash, {
									hash: linkHash,
									source: sourceHash,
									target: targetHash,
									color: '#ccc',
									total: 1,
									current: 1,
									normalizationIds: [],
									display: true,
									isNormalizationParent: false,
									viaId: null,
									replacedNode: null,
									itemIds: [item.id],
									label: label,
									directional: false
								});
							});
						});
					});
				});
            });
        });
    });

    // Turn maps into plain arrays and remove duplicates
    const nodes: Node[] = [];
    const usedIds = new Map<number, true>();

    parentNodeMap.forEach(node => {
    	if (usedIds.has(node.id)) {
    		return;
		}

		usedIds.set(node.id, true);
    	nodes.push(node);
	});

    const links: Link[] = [];
    linkMap.forEach(link => links.push(link));

    return {
        nodes: nodes,
        links: links
    };
}

function getIterableFieldValues(rawValue: any, deleted: Map<string, true>): string[] {
	if (rawValue === null) {
		return [];
	}

	if (!Array.isArray(rawValue)) {
		rawValue = [rawValue];
	}

	// Convert to strings
	rawValue = rawValue.map(value => {
		if (typeof value === 'boolean') {
			return value ? 'true' : 'false';
		}

		if (typeof value === 'undefined') {
			return '';
		}

		return value + '';
	});

	// Filter deleted nodes
	rawValue = rawValue.filter(value => !deleted.has(value));

	// Filter empty values
	return rawValue.filter(value => value !== '');
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
