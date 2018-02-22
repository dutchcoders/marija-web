import { slice, concat, without, reduce, remove, assign, find, forEach, union, filter, uniqBy } from 'lodash';
import {abbreviateNodeName, fieldLocator, normalize} from "./index";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Item} from "../interfaces/item";

function getHash(string) {
    let hash = 0, i, chr;
    string += '';

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
    fields,
    query,
    normalizations,
    aroundNodeId,
    deletedNodes: Node[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    let nodes: Node[] = concat(previousNodes, []);
    let links: Link[] = concat(previousLinks, []);

    let nodeCache = {};
    for (let node of nodes) {
        nodeCache[node.id] = node;
    }

    let linkCache = {};
    for (let link of links) {
        linkCache[link.source + link.target] = link;
    }

    const isDeleted = (nodeId: string): boolean =>
        typeof deletedNodes.find(node => node.id === nodeId) !== 'undefined';

    query = query.q;

    forEach(items, (d, i) => {
        forEach(fields, (source) => {
            let sourceValues = fieldLocator(d.fields, source.path);
            if (sourceValues === null) {
                return;
            }

            if (!Array.isArray(sourceValues)) {
                sourceValues = [sourceValues];
            }

            sourceValues.forEach(sourceValue => {
                switch (typeof sourceValue) {
                    case "boolean":
                        sourceValue = (sourceValue?"true":"false");
                }

                if (sourceValue === "" || typeof sourceValue === 'undefined') {
                    return;
                }

                if (isDeleted(sourceValue)) {
                    return;
                }

                if (aroundNodeId && aroundNodeId !== sourceValue) {
                    return;
                }

                let n = nodeCache[sourceValue];
                if (n) {
                    if (n.items.indexOf(d.id) === -1){
                        n.items.push(d.id);
                    }

                    if (n.fields.indexOf(source.path) === -1){
                        n.fields.push(source.path);
                    }

                    if (n.queries.indexOf(query) === -1) {
                        n.queries.push(query);
                    }
                } else {
                    let n: Node = {
                        id: sourceValue,
                        queries: [query],
                        items: [d.id],
                        count: d.count,
                        name: sourceValue,
                        abbreviated: abbreviateNodeName(sourceValue, query, 40),
                        description: '',
                        icon: source.icon,
                        fields: [source.path],
                        hash: getHash(sourceValue),
                        normalizationId: null,
                        display: true,
                        selected: false,
                        highlighted: false
                    };

                    nodeCache[n.id] = n;
                    nodes.push(n);
                }

                forEach(fields, (target) => {
                    let targetValues = fieldLocator(d.fields, target.path);
                    if (targetValues === null) {
                        return;
                    }

                    if (!Array.isArray(targetValues)) {
                        targetValues = [targetValues];
                    }

                    // todo(nl5887): issue with normalizing is if we want to use it as name as well.
                    // for example we don't want to have the first name only as name.
                    //
                    // we need to keep track of the fields the value is in as well.
                    targetValues.forEach(targetValue => {
                        switch (typeof targetValue) {
                            case "boolean":
                                targetValue = (targetValue?"true":"false");
                        }

                        const normalizedTargetValue = normalize(normalizations, targetValue);
                        if (normalizedTargetValue === ""  || typeof normalizedTargetValue === 'undefined') {
                            return;
                        }

                        if (isDeleted(normalizedTargetValue)) {
                            return;
                        }

                        let n = nodeCache[normalizedTargetValue];
                        if (n) {
                            if (n.items.indexOf(d.id) === -1){
                                n.items.push(d.id);
                            }

                            if (n.fields.indexOf(target.path) === -1){
                                n.fields.push(target.path);
                            }

                            if (n.queries.indexOf(query) === -1) {
                                n.queries.push(query);
                            }
                        } else {
                            let n: Node = {
                                id: normalizedTargetValue,
                                queries: [query],
                                items: [d.id],
                                count: d.count,
                                name: normalizedTargetValue,
                                abbreviated: abbreviateNodeName(normalizedTargetValue, query, 40),
                                description: '',
                                icon: target.icon,
                                fields: [target.path],
                                hash: getHash(normalizedTargetValue),
                                normalizationId: null,
                                display: true,
                                selected: false,
                                highlighted: false
                            };

                            nodeCache[n.id] = n;
                            nodes.push(n);
                        }

                        if (sourceValues.length > 1) {
                            // we don't want all individual arrays to be linked together
                            // those individual arrays being linked are (I assume) irrelevant
                            // otherwise this needs to be a configuration option
                            return;
                        }

                        // Dont create links from a node to itself
                        if (sourceValue === normalizedTargetValue) {
                            return;
                        }

                        let linkCacheRef = sourceValue + normalizedTargetValue;
                        let oppositeLinkCacheRef = normalizedTargetValue + sourceValue;

                        // check if link already exists
                        if ((linkCache[linkCacheRef]
                         || linkCache[oppositeLinkCacheRef])) {
                            return;
                        }

                        const link: Link = {
                            source: sourceValue,
                            target: normalizedTargetValue,
                            color: '#ccc',
                            total: 1,
                            current: 1,
                            normalizationId: null,
                            display: true
                        };

                        links.push(link);
                        linkCache[linkCacheRef] = link;
                    });
                });
            });
        });
    });

    return {
        nodes,
        links
    };
}