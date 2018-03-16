import fieldLocator from "./fieldLocator";
import abbreviateNodeName from "./abbreviateNodeName";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Item} from "../interfaces/item";
import {Search} from "../interfaces/search";
import {Field} from "../interfaces/field";

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

interface NodeMap {
    [id: string]: Node;
}

interface LinkMap {
    [sourceTarget: string]: Link
}

export default function getNodesAndLinks(
    previousNodes: Node[],
    previousLinks: Link[],
    items: Item[],
    fields: Field[],
    search: Search,
    aroundNodeId: string,
    deletedNodes: Node[] = []
): {
    nodes: Node[],
    links: Link[]
} {
    const nodeMap: NodeMap = {};
    previousNodes.forEach(node => nodeMap[node.id] = node);

    const linkMap: LinkMap = {};
    previousLinks.forEach(link => linkMap[link.source + link.target] = link);

    const deletedMap = {};
    deletedNodes.forEach(node => deletedMap[node.id] = true);

    const query: string = search.q;

    items.forEach(item => {
        fields.forEach(source => {
            let sourceValues = fieldLocator(item.fields, source.path);

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

                if (typeof sourceValue === 'undefined') {
                    return;
                }

                // Convert to string
                sourceValue += '';

                if (sourceValue === '') {
                    return;
                }

                if (deletedMap[sourceValue]) {
                    return;
                }

                if (aroundNodeId && aroundNodeId !== sourceValue) {
                    return;
                }

                let n = nodeMap[sourceValue];
                if (n) {
                    if (n.items.indexOf(item.id) === -1){
                        n.items.push(item.id);
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
                        items: [item.id],
                        count: item.count,
                        name: sourceValue,
                        abbreviated: abbreviateNodeName(sourceValue, query, 40),
                        description: '',
                        icon: source.icon,
                        fields: [source.path],
                        hash: getHash(sourceValue),
                        normalizationId: null,
                        display: true,
                        selected: false,
                        highlighted: false,
                        displayTooltip: false,
                        isNormalizationParent: false
                    };

                    nodeMap[n.id] = n;
                }

                fields.forEach(target => {
                    let targetValues = fieldLocator(item.fields, target.path);
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
                    targetValues.forEach((targetValue, i) => {
                        switch (typeof targetValue) {
                            case "boolean":
                                targetValue = (targetValue?"true":"false");
                        }

                        if (typeof targetValue === 'undefined') {
                            return;
                        }

                        // Convert to string
                        targetValue += '';

                        if (targetValue === '') {
                            return;
                        }

                        if (deletedMap[targetValue]) {
                            return;
                        }

                        let n = nodeMap[targetValue];
                        if (n) {
                            if (n.items.indexOf(item.id) === -1){
                                n.items.push(item.id);
                            }

                            if (n.fields.indexOf(target.path) === -1){
                                n.fields.push(target.path);
                            }

                            if (n.queries.indexOf(query) === -1) {
                                n.queries.push(query);
                            }
                        } else {
                            let n: Node = {
                                id: targetValue,
                                queries: [query],
                                items: [item.id],
                                count: item.count,
                                name: targetValue,
                                abbreviated: abbreviateNodeName(targetValue, query, 40),
                                description: '',
                                icon: target.icon,
                                fields: [target.path],
                                hash: getHash(targetValue),
                                normalizationId: null,
                                display: true,
                                selected: false,
                                highlighted: false,
                                displayTooltip: false,
                                isNormalizationParent: false
                            };

                            nodeMap[n.id] = n;
                        }

                        if (sourceValues.length > 1) {
                            // we don't want all individual arrays to be linked together
                            // those individual arrays being linked are (I assume) irrelevant
                            // otherwise this needs to be a configuration option
                            return;
                        }

                        // Dont create links from a node to itself
                        if (sourceValue === targetValue) {
                            return;
                        }

                        const key: string = sourceValue + targetValue;
                        const oppositeKey = targetValue + sourceValue;

                        // check if link already exists
                        if (linkMap[key]) {
                            // Add item to the link if it doesn't exist yet
                            if (linkMap[key].itemIds.indexOf(item.id) === -1) {
                                linkMap[key] = Object.assign({}, linkMap[key], {
                                    itemIds: linkMap[key].itemIds.concat([item.id])
                                });
                            }

                            return;
                        }

                        // check if opposite link already exists
                        if (linkMap[oppositeKey]) {
                            // Add item to the link if it doesn't exist yet
                            if (linkMap[oppositeKey].itemIds.indexOf(item.id) === -1) {
                                linkMap[oppositeKey] = Object.assign({}, linkMap[oppositeKey], {
                                    itemIds: linkMap[oppositeKey].itemIds.concat([item.id])
                                });
                            }

                            return;
                        }

                        linkMap[key] = {
                            source: sourceValue,
                            target: targetValue,
                            color: '#ccc',
                            total: 1,
                            current: 1,
                            normalizationId: null,
                            display: true,
                            isNormalizationParent: false,
                            viaId: null,
                            replacedNode: null,
                            itemIds: [item.id]
                        };
                    });
                });
            });
        });
    });

    const nodes: Node[] = Object.keys(nodeMap).map(key => nodeMap[key]);
    const links: Link[] = Object.keys(linkMap).map(key => linkMap[key]);

    return {
        nodes: nodes,
        links: links
    };
}