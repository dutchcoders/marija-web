import { Item } from '../interfaces/item';
import { AppState } from '../../main/interfaces/appState';
import { GraphWorkerPayload } from './graphWorkerClass';

export function getGraphWorkerPayload(state: AppState, items: Item[] = [], searchId: string = null): GraphWorkerPayload {
	return {
		items: items,
		searchId: searchId,
		prevNodes: state.graph.nodes,
		prevLinks: state.graph.links,
		prevItems: state.graph.items,
		normalizations: state.graph.normalizations,
		searches: state.graph.searches,
		deletedNodeIds: state.graph.deletedNodeIds,
		via: state.graph.via,
		filterBoringNodes: state.graph.filterBoringNodes,
		filterSecondaryQueries: state.graph.filterSecondaryQueries,
		connectors: state.fields.connectors,
		datasources: state.datasources.datasources,
		// Will be set in the middleware, right before sending it to the worker
		outputId: null,
		automaticallyCreateConnectors: state.graph.automaticallyCreateConnectors,
		fields: state.fields.availableFields,
		deletedConnectorFields: state.fields.deletedConnectorFields,
		noGroupingNodeIds: state.graph.noGroupingNodeIds,
		suggestedConnectors: state.fields.suggestedConnectors
	};
}