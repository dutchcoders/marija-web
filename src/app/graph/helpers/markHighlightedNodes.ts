import { Node } from '../interfaces/node';


export default function markHighlightedNodes(nodes: Node[], toHighlight: any): Node[] {
	nodes = nodes.concat([]);

	let level1Nodes: number[] = [];
	let level2Nodes: number[] = [];
	let level3Nodes: number[] = [];

	if (Array.isArray(toHighlight[0])) {
		level1Nodes = toHighlight[0].map(node => node.id);

		if (toHighlight[1]) {
			level2Nodes = toHighlight[1].map(node => node.id);
		}

		if (toHighlight[2]) {
			level3Nodes = toHighlight[2].map(node => node.id);
		}
	} else {
		level1Nodes = toHighlight.map(node => node.id);
	}

	nodes.forEach((node, index) => {
		let level: number = null;

		if (level1Nodes.indexOf(node.id) !== -1) {
			level = 1;
		} else if (level2Nodes.indexOf(node.id) !== -1) {
			level = 2;
		} else if (level3Nodes.indexOf(node.id) !== -1) {
			level = 3;
		}

		nodes[index] = {
			...nodes[index],
			highlightLevel: level
		};
	});

    return nodes;
}