import { Item } from '../interfaces/item';
import { Search } from '../../search/interfaces/search';

export function markItemsForDisplay(items: Item[], searches: Search[]): Item[] {
	const searchesCounter = {};
	const max = {};

	searches.forEach(search => max[search.searchId] = search.displayItems);

	return items.map(item => {
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