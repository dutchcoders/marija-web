import { Node } from '../interfaces/node';
import { Link } from '../interfaces/link';
import abbreviateNodeName from './abbreviateNodeName';

export function groupNodes(nodes: Node[], links: Link[]): { nodes: Node[], links: Link[] } {
	const items = nodes.filter(node => node.type === 'item');
	const nodeMap = new Map<number, Node>();
	items.forEach(item => nodeMap.set(item.id, item));

	const neighbours = getNeighbourItems(items, links);
	let idsToRemove: number[] = [];

	neighbours.forEach((itemIds: number[], key: string) => {
		if (key === '' || itemIds.length < 2) {
			return;
		}

		const groupedNode = nodeMap.get(itemIds[0]);
		const newIdsToRemove = itemIds.slice(1);
		const names: string[] = [];

		if (typeof groupedNode.name !== 'undefined' && groupedNode.name !== '') {
			names.push(groupedNode.name);
		}

		newIdsToRemove.forEach(id => {
			const node = nodeMap.get(id);

			groupedNode.count ++;
			groupedNode.r = 15 + groupedNode.count * 5;
			groupedNode.items = groupedNode.items.concat(node.items);

			if (typeof node.name !== 'undefined' && node.name !== '' && names.indexOf(node.name) === -1) {
				names.push(node.name);
			}

			Object.keys(node.childData).forEach(key => {
				if (!groupedNode.childData[key]) {
					groupedNode.childData[key] = [];
				}

				node.childData[key].forEach(value => {
					if (groupedNode.childData[key].indexOf(value) === -1) {
						groupedNode.childData[key].push(value);
					}
				});
			});
		});

		groupedNode.name = names.join(', ');
		groupedNode.abbreviated = groupedNode.name.substring(0, 40) + (groupedNode.name.length > 40 ? '...' : '');

		idsToRemove = idsToRemove.concat(newIdsToRemove);
	});

	nodes = nodes.filter(node => idsToRemove.indexOf(node.id) === -1);
	links = links.filter(link =>
		idsToRemove.indexOf(link.source) === -1
		&& idsToRemove.indexOf(link.target) === -1
	);

	return {
		nodes,
		links
	};
}

function getNeighbourItems(items: Node[], links: Link[]) {
	const linkMap = new Map<number, number[]>();

	links.forEach(link => {
		const source = linkMap.get(link.source);

		if (source) {
			source.push(link.target);
		} else {
			linkMap.set(link.source, [link.target]);
		}

		const target = linkMap.get(link.target);

		if (target) {
			target.push(link.source);
		} else {
			linkMap.set(link.target, [link.source]);
		}
	});

	const itemMap = new Map<string, number[]>();

	items.forEach(item => {
		const neighbourItem: number[] = [];
		const links: number[] = linkMap.get(item.id);

		if (links) {
			links.forEach(target => {
				const sources = linkMap.get(target);

				sources.forEach(source => {
					neighbourItem.push(source);
				});
			});
		}

		neighbourItem.sort();
		const key = neighbourItem.join('-');

		if (itemMap.has(key)) {
			itemMap.get(key).push(item.id);
		} else {
			itemMap.set(key, [item.id]);
		}
	});

	return itemMap;
}