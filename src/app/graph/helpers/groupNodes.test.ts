import { groupNodes } from './groupNodes';

function getItemNode(id: number) {
	return {
		id,
		type: 'item',
		items: [id],
		count: 1
	} as any
}

function getConnectorNode(id: number) {
	return {
		id,
		type: 'connector'
	} as any
}

function getLink(source: number, target: number) {
	return {
		source,
		target
	} as any
}

test('should group item nodes if they have the same connectors', () => {
	const nodes = [
		getItemNode(1),
		getItemNode(2),
		getItemNode(3),
		getItemNode(5),
		getItemNode(6),
		getConnectorNode(4),
		getConnectorNode(7)
	];

	const links = [
		getLink(1, 4),
		getLink(2, 4),
		getLink(3, 4),
		getLink(5, 7),
		getLink(6, 7),
	];

	const result = groupNodes(nodes, links);

	console.log(result);
});