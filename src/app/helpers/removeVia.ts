import {Node} from "../modules/graph/interfaces/node";
import {Link} from "../modules/graph/interfaces/link";
import {Via} from "../modules/graph/interfaces/via";

const getLink = (source: string, target: string): Link => {
    return {
        source: source,
        target: target,
        label: null,
        viaId: null,
        display: true,
        normalizationId: null,
        isNormalizationParent: false,
        total: 1,
        current: 1,
        color: '',
        replacedNode: null,
        itemIds: []
    };
};

export default function removeVia(nodes: Node[], links: Link[], remove: Via): {nodes: Node[], links: Link[]} {
    const removed: Link[] = [];

    const linkExists = (source: string, target: string): boolean => {
        const link = links.find(search =>
            ((search.source === source && search.target === target)
            || (search.target === source && search.source === target))
            && !search.label
        );

        return typeof link !== 'undefined';
    };

    const nodeExists = (id: string): boolean => {
        const node = nodes.find(search => search.id === id);
        return typeof node !== 'undefined';
    };

    links = links.filter(link => {
        const willRemove: boolean = link.viaId === remove.id;

        if (willRemove) {
            removed.push(link);
        }

        return !willRemove;
    });

    nodes = nodes.concat([]);

    removed.forEach(link => {
        const node: Node = link.replacedNode;

        if (!nodeExists(node.id)) {
            nodes.push(node);
        }

        if (!linkExists(link.source, node.id)) {
            links.push(getLink(link.source, node.id));
        }

        if (!linkExists(link.target, node.id)) {
            links.push(getLink(link.target, node.id));
        }

        if (!linkExists(link.source, link.target)) {
            links.push(getLink(link.source, link.target));
        }
    });

    return {
        nodes,
        links
    };
}