import fieldLocator from '../../fields/helpers/fieldLocator';
import { Field } from '../../fields/interfaces/field';
import { Item } from '../../items/interfaces/item';
import { Search } from '../../search/interfaces/search';
import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';
import abbreviateNodeName from './abbreviateNodeName';

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

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    fields: Field[],
    search: Search,
    aroundNodeId: number | undefined = undefined,
    deletedNodes: Node[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    const nodeMap = new Map<number, Node>();
    previousNodes.forEach(node => nodeMap.set(node.id, node));

    const linkMap = new Map<number, Link>();
    previousLinks.forEach(link => linkMap.set(link.hash, link));

    const deletedMap = new Map<string, true>();
    deletedNodes.forEach(node => deletedMap.set(node.name, true));

    const searchId: string = search.searchId;

    const createNode = (field: Field, item: Item) => {

	};

    items.forEach(item => {
        fields.forEach(sourceField => {
            const sourceValues = getIterableFieldValues(fieldLocator(item.fields, sourceField.path), deletedMap);

            sourceValues.forEach(sourceValue => {
                let activeSourceValue: string;

                if (sourceField.childOf) {
                    const parentSourceField = fields.find(field => field.path === sourceField.childOf);
                    const parentSourceValue = fieldLocator(item.fields, sourceField.childOf);
                    const parentSourceHash = getHash(parentSourceValue);

					activeSourceValue = parentSourceValue;

                    const existingParentSource: Node = nodeMap.get(parentSourceHash);

					if (existingParentSource) {
						if (existingParentSource.items.indexOf(item.id) === -1) {
							existingParentSource.items.push(item.id);
						}

						if (existingParentSource.fields.indexOf(sourceField.path) === -1) {
							existingParentSource.fields.push(sourceField.path);
						}

						if (existingParentSource.searchIds.indexOf(searchId) === -1) {
							existingParentSource.searchIds.push(searchId);
						}

						existingParentSource.childData[sourceField.path] = sourceValue;

						nodeMap.set(getHash(sourceValue), existingParentSource);

					} else {
						// Create new node
						const newNode = {
							id: parentSourceHash,
							searchIds: [searchId],
							items: [item.id],
							count: item.count,
							name: parentSourceValue,
							abbreviated: abbreviateNodeName(parentSourceHash, searchId, 40),
							description: '',
							icon: parentSourceField.icon,
							fields: [parentSourceField.path],
							hash: parentSourceHash,
							normalizationId: null,
							display: true,
							selected: false,
							highlighted: false,
							displayTooltip: false,
							isNormalizationParent: false,
							important: false,
							isGeoLocation: parentSourceField.type === 'location',
							isImage: parentSourceField.type === 'image',
							childData: {
								[sourceField.path]: sourceValue
							}
						};

						nodeMap.set(parentSourceHash, newNode);
						nodeMap.set(getHash(sourceValue), newNode);
					}
                } else {
                	activeSourceValue = sourceValue;

					const existingSource: Node = nodeMap.get(getHash(sourceValue));

					if (existingSource) {
						if (existingSource.items.indexOf(item.id) === -1) {
							existingSource.items.push(item.id);
						}

						if (existingSource.fields.indexOf(sourceField.path) === -1) {
							existingSource.fields.push(sourceField.path);
						}

						if (existingSource.searchIds.indexOf(searchId) === -1) {
							existingSource.searchIds.push(searchId);
						}
					} else {
						const hash = getHash(sourceValue);

						// Create new node
						nodeMap.set(hash, {
							id: hash,
							searchIds: [searchId],
							items: [item.id],
							count: item.count,
							name: sourceValue,
							abbreviated: abbreviateNodeName(sourceValue, searchId, 40),
							description: '',
							icon: sourceField.icon,
							fields: [sourceField.path],
							hash: hash,
							normalizationId: null,
							display: true,
							selected: false,
							highlighted: false,
							displayTooltip: false,
							isNormalizationParent: false,
							important: false,
							isGeoLocation: sourceField.type === 'location',
							isImage: sourceField.type === 'image',
							childData: {}
						});
					}
				}

                fields.forEach(targetField => {
                    let targetValues = getIterableFieldValues(fieldLocator(item.fields, targetField.path), deletedMap);

                    // we need to keep track of the fields the value is in as well.
                    targetValues.forEach(targetValue => {
						let activeTargetValue: string;

						if (targetField.childOf) {
							const parentTargetField = fields.find(field => field.path === targetField.childOf);
							const parentTargetValue = fieldLocator(item.fields, targetField.childOf);
							const parentTargetHash = getHash(parentTargetValue);

							// activeTargetValue = parentTargetValue;

							const existingParentTarget: Node = nodeMap.get(getHash(targetValue));

							if (existingParentTarget) {
								activeTargetValue = existingParentTarget.name;

								if (existingParentTarget.items.indexOf(item.id) === -1) {
									existingParentTarget.items.push(item.id);
								}

								if (existingParentTarget.fields.indexOf(targetField.path) === -1) {
									existingParentTarget.fields.push(targetField.path);
								}

								if (existingParentTarget.searchIds.indexOf(searchId) === -1) {
									existingParentTarget.searchIds.push(searchId);
								}

								// .childData[targetField.path] = targetValue;

								nodeMap.set(getHash(targetValue), existingParentTarget);

							} else {
								activeTargetValue = parentTargetValue;

								// Create new node
								const newNode = {
									id: parentTargetHash,
									searchIds: [searchId],
									items: [item.id],
									count: item.count,
									name: parentTargetValue,
									abbreviated: abbreviateNodeName(parentTargetHash, searchId, 40),
									description: '',
									icon: parentTargetField.icon,
									fields: [parentTargetField.path],
									hash: parentTargetHash,
									normalizationId: null,
									display: true,
									selected: false,
									highlighted: false,
									displayTooltip: false,
									isNormalizationParent: false,
									important: false,
									isGeoLocation: parentTargetField.type === 'location',
									isImage: parentTargetField.type === 'image',
									childData: {
										[targetField.path]: targetValue
									}
								};

								nodeMap.set(parentTargetHash, newNode);
								nodeMap.set(getHash(targetValue), newNode);
							}

                        } else {
							activeTargetValue = targetValue;

							const existingTarget: Node = nodeMap.get(getHash(targetValue));
							if (existingTarget) {
								if (existingTarget.items.indexOf(item.id) === -1){
									existingTarget.items.push(item.id);
								}

								if (existingTarget.fields.indexOf(targetField.path) === -1){
									existingTarget.fields.push(targetField.path);
								}

								if (existingTarget.searchIds.indexOf(searchId) === -1) {
									existingTarget.searchIds.push(searchId);
								}
							} else {
								const hash = getHash(targetValue);

								// Create new node
								nodeMap.set(hash, {
									id: hash,
									searchIds: [searchId],
									items: [item.id],
									count: item.count,
									name: targetValue,
									abbreviated: abbreviateNodeName(targetValue, searchId, 40),
									description: '',
									icon: targetField.icon,
									fields: [targetField.path],
									hash: hash,
									normalizationId: null,
									display: true,
									selected: false,
									highlighted: false,
									displayTooltip: false,
									isNormalizationParent: false,
									important: false,
									isGeoLocation: targetField.type === 'location',
									isImage: targetField.type === 'image',
									childData: {}
								});
							}
                        }

                        if (sourceValues.length > 1) {
                            // we don't want all individual arrays to be linked together
                            // those individual arrays being linked are (I assume) irrelevant
                            // otherwise this needs to be a configuration option
                            return;
                        }

                        // Dont create links from a node to itself
                        if (activeSourceValue === activeTargetValue) {
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


						const sourceHash = getHash(activeSourceValue);
						const targetHash = getHash(activeTargetValue);
						const linkHash = sourceHash + targetHash;

                        if (linkExists(linkHash)) {
                            return;
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
                            itemIds: [item.id]
                        });
                    });
                });
            });
        });
    });

    // Turn maps into plain arrays and remove duplicates
    const nodes: Node[] = [];
    const usedIds = new Map<number, true>();

    nodeMap.forEach(node => {
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