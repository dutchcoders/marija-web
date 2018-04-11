import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";

export function getNodeHierarchy(nodes: Node[], links: Link[]) {
    const neighbourMap = getNeighbourMap(nodes, links);

    let hierarchyNodes = nodes.map(node => {
        const hierarchyNode: any = {...node};
        hierarchyNode.linksTo = neighbourMap[node.id];

        return hierarchyNode;
    });

    const hierarchy = {};

    const find = (id: string, data?: any) => {
        let node = hierarchy[id];
        let i: number;

        if (!node) {
            node = hierarchy[id] = data || {id: id, children: []};

            if (id) {
                node.parent = find(id.substring(0, i = id.lastIndexOf(".")));
                node.parent.children.push(node);
            }
        }

        return node;
    };

    hierarchyNodes.forEach((d) => {
        find(d.id, d);
    });

    return hierarchy[''];
}

function getNeighbourMap(nodes: Node[], links: Link[]) {
    const nodeMap = {};
    nodes.forEach(node => nodeMap[node.id] = true);

    const neighbours = {};

    links.forEach(link => {
        if (nodeMap[link.target]) {
            if (neighbours[link.source]) {
                neighbours[link.source].push(link.target);
            } else {
                neighbours[link.source] = [link.target];
            }
        }

        if (nodeMap[link.source]) {
            if (neighbours[link.target]) {
                neighbours[link.target].push(link.source);
            } else {
                neighbours[link.target] = [link.source];
            }
        }
    });

    return neighbours;
}