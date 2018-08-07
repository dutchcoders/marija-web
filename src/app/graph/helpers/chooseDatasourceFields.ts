import { Datasource } from '../../datasources/interfaces/datasource';
import { Item } from '../interfaces/item';
import { Field } from '../../fields/interfaces/field';
import {
	FieldStatList,
	getFieldStats
} from '../../fields/helpers/getFieldStats';

export function chooseDatasourceFields(datasource: Datasource, fields: Field[], items: Item[]): Datasource {
	const fieldStats = getFieldStats(fields, items);

	return {
		...datasource,
		labelFieldPath: getMostUniqueField(['text', 'string'], fields, fieldStats),
		imageFieldPath: getMostUniqueField(['image'], fields, fieldStats),
		locationFieldPath: getMostUniqueField(['location'], fields, fieldStats),
		dateFieldPath: getMostUniqueField(['date'], fields, fieldStats),
	};
}

function getMostUniqueField(types: string[], fields: Field[], fieldStats: FieldStatList): string {
	const paths = fields
		.filter(field => types.indexOf(field.type) !== -1)
		.map(field => field.path);

	let mostUnique: string = null;
	let mostUniqueValues: number = 0;
	const maxAverageLength = 50;

	paths.forEach(path => {
		if (fieldStats[path]) {
			const total = fieldStats[path].valueLengths.reduce((prev, current) =>
				prev + current,
				0
			);

			const averageLength = total / fieldStats[path].valueLengths.length;

			if (averageLength <= maxAverageLength && fieldStats[path].uniqueValues.length > mostUniqueValues) {
				mostUnique = path;
				mostUniqueValues = fieldStats[path].uniqueValues.length;
			}
		}
	});

	return mostUnique;
}