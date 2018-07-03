import { Item } from '../../items/interfaces/item';
import { AppState } from '../../main/interfaces/appState';
import { GraphWorkerPayload } from './graphWorkerClass';
import { getSelectedFields } from '../graphSelectors';

export function getGraphWorkerPayload(state: AppState, items: Item[] = [], searchId: string = null): GraphWorkerPayload {
	return {
		items: items,
		searchId: searchId,
		prevNodes: state.graph.nodes,
		prevLinks: state.graph.links,
		prevItems: state.graph.items,
		fields: getSelectedFields(state),
		normalizations: state.graph.normalizations,
		searches: state.graph.searches,
		deletedNodes: state.graph.deletedNodes,
		via: state.graph.via,
		receivedAt: Date.now(),
		sortType: state.table.sortType,
		sortColumn: state.table.sortColumn,
		filterBoringNodes: state.graph.filterBoringNodes,
		filterSecondaryQueries: state.graph.filterSecondaryQueries,
		nodeMatchers: state.graph.nodeMatchers,
		datasources: state.datasources.datasources
	};
}