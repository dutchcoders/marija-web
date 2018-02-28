import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Via} from "../interfaces/via";

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
        replacedNode: null
    };
};

export default function removeVia(nodes: Node[], links: Link[], remove: Via): {nodes: Node[], links: Link[]} {
    const removed: Link[] = [];

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

        nodes.push(node);
        links.push(getLink(link.source, node.id));
        links.push(getLink(link.target, node.id));
        links.push(getLink(link.source, link.target));
    });

    return {
        nodes,
        links
    };
}