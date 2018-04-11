import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';

export default function getDirectlyRelatedNodes(nodes: Node[], allNodes: Node[], allLinks: Link[]) {
    const nodeMap = {};
    nodes.forEach(node => nodeMap[node.id] = true);

    const relatedLinks = allLinks.filter(link =>
        nodeMap[link.source] || nodeMap[link.target]
    );

    const linkSourceMap = {};
    relatedLinks.forEach(link => linkSourceMap[link.source] = true);

    const linkTargetMap = {};
    relatedLinks.forEach(link => linkTargetMap[link.target] = true);

    return allNodes.filter(node =>
        linkSourceMap[node.id] || linkTargetMap[node.id]
    );
}