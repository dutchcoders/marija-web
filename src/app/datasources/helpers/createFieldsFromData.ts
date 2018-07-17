import { Item } from '../../items/interfaces/item';
import { Field } from '../../fields/interfaces/field';
import { detectFieldType } from './detectFieldType';

export function createFieldsFromData(items: Item[], datasourceId: string): Field[] {
	const paths = Object.keys(items[0].fields);

	return paths.map(path => {
		const exampleValues: string[] = [];

		items.forEach(item => {
			const value = item.fields[path];

			if (value !== null && typeof value !== 'undefined' && value !== '' && exampleValues.indexOf(value) === -1) {
				exampleValues.push(value);
			}
		});

		return {
			path: path,
			type: detectFieldType(exampleValues),
			datasourceId: datasourceId,
			exampleValues: exampleValues
		}
	});
}