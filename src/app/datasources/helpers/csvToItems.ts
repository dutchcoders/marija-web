import { Item } from '../../items/interfaces/item';
import * as parse from 'csv-parse/lib/sync';
import { uniqueId } from 'lodash';

export function csvToItems(csv: string, delimiter: string, datasourceId: string): Item[] {
	const result = parse(csv, { delimiter });

	const headers = result[0].map(header => header.toLowerCase());
	result.shift();

	const items: Item[] = result.map(row => {
		const fields: any = {};

		headers.forEach((header, i) => {
			fields[header] = row[i];
		});

		return {
			id: uniqueId(),
			datasourceId: datasourceId,
			highlight: null,
			count: 1,
			fields: fields,
			requestedExtraData: false,
			receivedExtraData: false,
			nodes: [],
		}
	});

	return items;
}