import { Node } from '../interfaces/node';
import { Field } from '../../fields/interfaces/field';

export interface ValueInfo {
	value: string;
	occurences: number;
	nodes: Node[];
	fields: string[];
}

export function getValueInfo(nodes: Node[], fields: Field[]): ValueInfo[] {
	const list: ValueInfo[] = [];
	const dateFields = new Map<string, true>();

	fields.forEach(field => {
		if (field.type === 'date') {
			dateFields.set(field.path, true);
		}
	});

	const itemNodes = nodes.filter(node => node.type === 'item');

	itemNodes.forEach(node => {
		Object.keys(node.childData).forEach(key => {
			if (dateFields.has(key)) {
				return;
			}

			let values = node.childData[key];

			values.forEach(value => {
				if (value === null || typeof value === 'undefined' || value === '') {
					return;
				}

				value = value + '';

				let info = list.find(info => info.value === value);

				if (info) {
					info.occurences ++;

					if (info.fields.indexOf(key) === -1) {
						info.fields.push(key);
					}
				} else {
					list.push({
						value,
						fields: [key],
						occurences: 1,
						nodes: getNodesByValue(value, nodes)
					});
				}
			});
		});
	});

	list.sort((a, b) => b.occurences - a.occurences);

	return list;
}

function getNodesByValue(value: string, nodes: Node[]): Node[] {
	return nodes.filter(node => {
		const keys = Object.keys(node.childData);

		for (let i = 0; i < keys.length; i ++) {
			const values = node.childData[keys[i]];

			for (let j = 0; j < values.length; j ++) {
				if (values[j] === value) {
					return true;
				}
			}
		}

		return false;
	});
}