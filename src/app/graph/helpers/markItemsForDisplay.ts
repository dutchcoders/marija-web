import { Item } from '../interfaces/item';
import { Search } from '../../search/interfaces/search';
import { Datasource } from '../../datasources/interfaces/datasource';

export function markItemsForDisplay(items: Item[], searches: Search[], datasources: Datasource[]): Item[] {
	const searchesCounter = {};
	const max = {};

	searches.forEach(search => max[search.searchId] = search.displayItems);

	const enrichers = new Map<string, true>();

	datasources.filter(datasource => datasource.isEnricher)
		.map(datasource => enrichers.set(datasource.id, true));

	return items.map(item => {
		// Always show enrichers
		if (enrichers.has(item.datasourceId)) {
			return {
				...item,
				display: true
			}
		}

		if (typeof max[item.searchId] === 'undefined') {
			return item;
		}

		let display = true;

		if (searchesCounter[item.searchId]) {
			searchesCounter[item.searchId] ++;
		} else {
			searchesCounter[item.searchId] = 1;
		}

		if (searchesCounter[item.searchId] > max[item.searchId]) {
			display = false;
		}

		return {
			...item,
			display
		};
	});
}