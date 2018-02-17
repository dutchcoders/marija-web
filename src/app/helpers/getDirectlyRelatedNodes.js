export default function getDirectlyRelatedNodes(nodes, allNodes, allLinks) {
    const relatedLinks = allLinks.filter(link =>
        typeof nodes.find(
            node => node.id === link.source || node.id === link.target
        ) !== 'undefined'
    );

    return allNodes.filter(node =>
        typeof relatedLinks.find(
            link => link.source === node.id || link.target === node.id
        ) !== 'undefined'
    );
}