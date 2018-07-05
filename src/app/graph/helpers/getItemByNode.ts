import { Item } from '../../items/interfaces/item';
import { Node } from '../interfaces/node';

export function getItemByNode(node: Node, items: Item[]): Item {
	if (node.items.length > 1) {
		throw new Error('Attempted to get 1 item for a node that has multiple items. This function is only meant for nodes of the item type, which only have 1 item.');
	}

	return items.find(item => item.id === node.items[0]);
}