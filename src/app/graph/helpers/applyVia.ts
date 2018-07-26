import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';
import { Via } from '../interfaces/via';
import { getNumericHash } from './getNumericHash';

function getConnectedNodes(node, nodes, links) {
    const connected = [];

    links.forEach(link => {
        if (link.target === node.id) {
            connected.push(nodes.find(search => search.id === link.source));
        } else if (link.source === node.id) {
            connected.push(nodes.find(search => search.id === link.target));
        }
    });

    return connected;
}

function getLinkLabel(label) {
    label += '';

    const maxLength = 20;

    if (label.length <= maxLength) {
        return label;
    }

    const shortened = label.substring(0, maxLength - 1);

    return shortened + '...';
}

export default function applyVia(nodes: Node[], links: Link[], via: Via[]) {
    links = links.concat([]);
    nodes = nodes.concat([]);

    const removeNode = (node) => {
        links = links.filter(link =>
            link.source !== node.id && link.target !== node.id
        );
        nodes = nodes.filter(search => search.id !== node.id);
    };

    const removeUnlabeledLinks = (sourceId, targetId) => {
        links = links.filter(link => {
            const remove =
                ((link.source === sourceId && link.target === targetId)
                || (link.source === targetId && link.target === sourceId))
                && !link.label;

            return !remove;
        });
    };

    const nodesToRemove = [];
    const linksToRemove = [];

    via.forEach(viaItem => {
        const step1Nodes: Node[] = nodes.filter(node =>
            node.fields.length === 1
            && node.fields[0] === viaItem.from
        );

        step1Nodes.forEach(step1Node => {
            const connected = getConnectedNodes(step1Node, nodes, links);

            const step2Nodes: Node[] = connected.filter(search =>
                search.fields.length === 1
                && search.fields[0] === viaItem.via
            );

            step2Nodes.forEach(step2Node => {
                const connected: Node[] = getConnectedNodes(step2Node, nodes, links);

                const step3Nodes = connected.filter(search =>
                    search.fields.length === 1
                    && search.id !== step1Node.id
                    && search.fields[0] === viaItem.to
                );

                step3Nodes.forEach(step3Node => {
                    // Now we found something that can be replaced by a labeled link
                    // but first check if we didn't already do that, but then
                    // the other way around
                    const label: string = getLinkLabel(step2Node.name);

                    const existing = links.find(link =>
                        (link.target === step1Node.id && link.source === step3Node.id && link.label === label)
                        || (link.source === step1Node.id && link.target === step3Node.id && link.label === label)
                    );

                    if (typeof existing === 'undefined') {
                        links.push({
                            hash: getNumericHash(step1Node.id + step3Node.id),
                            source: step1Node.id,
                            target: step3Node.id,
                            label: label,
                            viaId: viaItem.id,
                            display: true,
                            total: 1,
                            current: 1,
                            color: '',
                            replacedNode: step2Node,
                            itemIds: [],
                            directional: true,
                            highlighted: false
                        });
                    }

                    nodesToRemove.push(step2Node);
                    linksToRemove.push({
                        from: step1Node,
                        to: step3Node
                    });
                });
            });
        });
    });

    nodesToRemove.forEach(node => removeNode(node));
    linksToRemove.forEach(data => {
        removeUnlabeledLinks(data.from.id, data.to.id);
    });

    const counter = {};

    links = links.map(link => {
        const key = link.source + link.target;
        let current = counter[key] ? counter[key] : 0;

        current += 1;

        counter[key] = current;

        return Object.assign({}, link, {
            current: current
        });
    });

    links = links.map(link => {
        return Object.assign({}, link, {
            total: counter[link.source + link.target]
        });
    });

    return {
        nodes,
        links
    };
}