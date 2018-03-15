import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";

export default function removeDeadLinks(nodes: Node[], links: Link[]) {
    const nodeMap = {};
    nodes.forEach(node => nodeMap[node.id] = true);

    return links.filter(link =>
        nodeMap[link.source]
        && nodeMap[link.target]
    );
}