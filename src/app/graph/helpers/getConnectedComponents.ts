import { Link } from '../interfaces/link';
import { Node } from '../interfaces/node';

function getNeighbourMap(links: Link[]): Map<number, number[]> {
    const neighbours = new Map<number, number[]>();

    links.forEach(link => {
        const sourceItem = neighbours.get(link.source);

        if (sourceItem) {
            sourceItem.push(link.target);
        } else {
            neighbours.set(link.source, [link.target]);

			if (!link.target) {
			    console.log(link);

				throw new Error('target undefined ' + link.target);
			}
        }

		const targetItem = neighbours.get(link.target);

		if (targetItem) {
			targetItem.push(link.source);
		} else {
			neighbours.set(link.target, [link.source]);

			if (!link.source) {
			    console.log(link);
			    throw new Error('source undefined ' + link.source);
            }
		}
    });

    return neighbours;
}

function getNodeMap(nodes) {
    const map = {};

    nodes.forEach(node => map[node.id] = node);

    return map;
}

export default function getConnectedComponents(nodes: Node[], links: Link[]) {
    const visited = [];
    const groups = {};
    const neighbours = getNeighbourMap(links);
    const nodeMap = getNodeMap(nodes);

    const addToGroup = (groupId, nodeId) => {
        const node = nodeMap[nodeId];

        if (!node) {
            throw new Error('Could not find node ' + nodeId);
        }

        visited.push(nodeId);

        if (groups[groupId]) {
            groups[groupId].push(node);
        } else {
            groups[groupId] = [node];
        }
    };

    const isInGroup = (nodeId) => {
        return visited.indexOf(nodeId) !== -1;
    };

    const depthFirstSearch = (nodeId: number, groupId) => {
		const neighboursForNode = neighbours.get(nodeId);

        if (!neighboursForNode) {
            return;
        }

        neighboursForNode.forEach(loopNodeId => {
			if (isInGroup(loopNodeId)) {
				return;
			}

			if (!loopNodeId) {
				throw new Error('Loop node id not defined ' + loopNodeId);
			}


			addToGroup(groupId, loopNodeId);
			depthFirstSearch(loopNodeId, groupId);
        });
    };

    let groupId = 1;

    nodes.forEach(node => {
        if (isInGroup(node.id)) {
            return;
        }

        addToGroup(groupId, node.id);
        depthFirstSearch(node.id, groupId);

        groupId ++;
    });

    const values = Object.keys(groups).map((key) => {
        return groups[key];
    });

    return values;
}