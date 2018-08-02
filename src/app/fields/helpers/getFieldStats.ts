import { Field } from '../interfaces/field';
import { Item } from '../../graph/interfaces/item';

export interface FieldStats {
	values: number;
	uniqueValues: string[];
	valueLengths: number[];
}

export interface FieldStatList {
	[field: string]: FieldStats
}

export function getFieldStats(fields: Field[], items: Item[]): FieldStatList {
	const fieldStats: FieldStatList = {};

	items.forEach(item => {
		Object.keys(item.fields).forEach(key => {
			let values = item.fields[key];

			if (values === null || values === '' || typeof values === 'undefined') {
				return;
			}

			if (!Array.isArray(values)) {
				values = [values];
			}

			if (typeof fieldStats[key] === 'undefined') {
				fieldStats[key] = {
					values: 0,
					uniqueValues: [],
					valueLengths: []
				};
			}

			values.forEach(value => {
				fieldStats[key].values ++;

				if (fieldStats[key].uniqueValues.indexOf(value) === -1) {
					fieldStats[key].uniqueValues.push(value);
				}

				const string = '' + value;

				fieldStats[key].valueLengths.push(string.length);
			});
		});
	});

	return fieldStats;
}