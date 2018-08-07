import {concat, isEqual, uniqueId, without} from 'lodash';
import {
	AUTH_CONNECTED,
	ERROR,
	REQUEST_COMPLETED
} from '../connection/connectionConstants';
import darkenColor from '../search/helpers/darkenColor';
import getQueryColor from '../search/helpers/getQueryColor';
import {Search} from '../search/interfaces/search';
import {
	ACTIVATE_LIVE_DATASOURCE,
	ADD_LIVE_DATASOURCE_SEARCH,
	CONFIRM_ITEMS,
	DEACTIVATE_LIVE_DATASOURCE,
	DISMISS_ITEMS_TO_CONFIRM,
	ITEMS_NEED_CONFIRMATION,
	SEARCH_DELETE,
	SEARCH_EDIT,
	SEARCH_FIELDS_UPDATE,
	SEARCH_RECEIVE,
	SEARCH_REQUEST, SET_SEARCH_TOTAL
} from '../search/searchConstants';
import {
	DEFAULT_DISPLAY_ITEMS_PER_SEARCH, DELETE_SEARCH_NODES, DONT_GROUP_NODE,
	FIELD_NODES_HIGHLIGHT,
	GRAPH_WORKER_OUTPUT,
	NODE_UPDATE,
	NODES_DELETE,
	NODES_DESELECT,
	NODES_HIGHLIGHT,
	NODES_SELECT,
	NODES_TOOLTIP,
	SELECT_FIELD_NODES,
	SELECTION_CLEAR,
	SET_AUTOMATICALLY_CREATE_CONNECTORS,
	SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID,
	SET_FIELD_PARENT,
	SET_FILTER_BORING_NODES, SET_FILTER_NODES_BY,
	SET_FILTER_SECONDARY_QUERIES, SET_GROUP_NODES,
	SET_IMPORTANT_NODE,
	SET_IS_DRAGGING_SUB_FIELDS,
	SET_MAP_ACTIVE,
	SET_NOTE,
	SET_TIMELINE_GROUPING,
	TOGGLE_LABELS,
	VIA_ADD,
	VIA_DELETE
} from './graphConstants';
import applyVia from './helpers/applyVia';
import {deselectNodes} from './helpers/deselectNodes';
import markHighlightedNodes from './helpers/markHighlightedNodes';
import removeNodesAndLinks from './helpers/removeNodesAndLinks';
import removeVia from './helpers/removeVia';
import {selectNodes} from './helpers/selectNodes';
import {Node} from './interfaces/node';
import {Via} from './interfaces/via';
import {GraphState} from "./interfaces/graphState";
import { markPerformance } from '../main/helpers/performance';
import { Item } from './interfaces/item';
import {
	RECEIVE_WORKSPACE,
	SET_EXPERIMENTAL_FEATURES
} from '../ui/uiConstants';
import { Workspace } from '../ui/interfaces/workspace';
import { markHighlightedLinks } from './helpers/markHighlightedLinks';
import { GraphWorkerOutput } from './helpers/graphWorkerClass';
import {
	DELETE_CONNECTOR,
	DELETE_FROM_CONNECTOR,
	MOVE_RULE_BETWEEN_CONNECTORS,
	MOVE_RULE_TO_NEW_CONNECTOR
} from '../fields/fieldsConstants';
import removeDeadLinks from './helpers/removeDeadLinks';
import { markItemsForDisplay } from './helpers/markItemsForDisplay';

export const defaultGraphState: GraphState = {
    items: [],
    searches: [],
    nodes: [], // all nodes
    links: [], // relations between nodes
    deletedNodeIds: [],
    via: [],
    showLabels: true,
    isMapActive: false,
    timelineGrouping: 'day',
    graphWorkerCacheIsValid: false,
	filterBoringNodes: false,
	filterSecondaryQueries: false,
	isDraggingSubFields: false,
	importantNodeIds: [],
	notes: [],
	graphWorkerLoading: false,
	expectedGraphWorkerOutputId: '',
	automaticallyCreateConnectors: true,
	noGroupingNodeIds: [],
	groupNodes: true,
	filterNodesBy: '',
	queryHistory: []
};

export default function graphReducer(state: GraphState = defaultGraphState, action): GraphState {
    switch (action.type) {
        case NODES_DELETE: {
        	const deletedNodeIds: number[] = state.deletedNodeIds.concat([]);
        	const deleteNodeIds: number[] = action.payload.nodes
                // Connector nodes can not be deleted
                .filter(node => node.type === 'item')
                .map(node => node.id);

        	deleteNodeIds.forEach(nodeId => {
        		if (deletedNodeIds.indexOf(nodeId) === -1) {
        			deletedNodeIds.push(nodeId);
				}
			});

			return {
				...state,
				deletedNodeIds
			};
        }

		case DELETE_SEARCH_NODES: {
			const {nodes, links} = removeNodesAndLinks(state.nodes, state.links, action.payload.searchId);

			return {
				...state,
				nodes,
				links
			};
		}

        case SEARCH_DELETE: {
            const toDelete: Search = action.payload.search;
            const searches = state.searches.filter((search: Search) =>
                search.searchId !== toDelete.searchId
            );
            let items = concat(state.items);

            items = items.filter(item => item.searchId !== toDelete.searchId);

            const {nodes, links} = removeNodesAndLinks(state.nodes, state.links, toDelete.searchId);

            return Object.assign({}, state, {
                searches: searches,
                items: items,
                nodes: nodes,
                links: links,
				graphWorkerCacheIsValid: false
            });
        }
        case VIA_ADD: {
            const newVia: Via = {
                from: action.via.from,
                to: action.via.to,
                via: action.via.via,
                id: uniqueId()
            };

            const existing: Via = state.via.find(search =>
                search.from === newVia.from
                && search.via === newVia.via
                && search.to === newVia.to
            );

            if (typeof existing !== 'undefined') {
                // Already exists
                return state;
            }

            const via: Via[] = state.via.concat([newVia]);
            const { nodes, links } = applyVia(state.nodes, state.links, via);

            return Object.assign({}, state, {
                via: via,
                nodes: nodes,
                links: links,
				graphWorkerCacheIsValid: false
            });
        }
        case VIA_DELETE: {
            const via: Via[] = state.via.filter(search => search.id !== action.via.id);
            const { nodes, links } = removeVia(state.nodes, state.links, action.via);

            return {
                ...state,
                via: via,
                nodes: nodes,
                links: links,
				graphWorkerCacheIsValid: false
            };
        }

        case NODES_TOOLTIP: {
            const nodes = state.nodes.concat([]);
            const ids = action.nodes.map(node => node.id);

            nodes.forEach((node, index) => {
                const shouldTooltip: boolean = ids.indexOf(node.id) !== -1;

                if (shouldTooltip && !node.displayTooltip) {
                    nodes[index] = Object.assign({}, node, {
                        displayTooltip: true
                    });
                } else if (!shouldTooltip && node.displayTooltip) {
                    nodes[index] = Object.assign({}, node, {
                        displayTooltip: false
                    });
                }
            });

            return Object.assign({}, state, {
                nodes: nodes
            });
        }
        case NODES_SELECT: {
			const nodes: Node[] = selectNodes(action.nodes, state.nodes);

            return {
                ...state,
                nodes: nodes,
				graphWorkerCacheIsValid: false
            };
        }
        case NODES_DESELECT: {
            const nodes: Node[] = deselectNodes(action.nodes, state.nodes);

            return {
                ...state,
                nodes: nodes,
				graphWorkerCacheIsValid: false
            };
        }
        case SELECTION_CLEAR: {
            const nodes: Node[] = state.nodes.concat([]);

            nodes.forEach((node, index) => {
                if (node.selected) {
                    nodes[index] = Object.assign({}, node, {
                        selected: false
                    });
                }
            });

            return {
                ...state,
                nodes: nodes,
				graphWorkerCacheIsValid: false
            };
        }
        case SELECT_FIELD_NODES: {
            const fieldPath: string = action.payload.fieldPath;

            const fieldNodes: Node[] = state.nodes.filter(node =>
                node.fields.indexOf(fieldPath) !== -1
            );

            const alreadySelected: boolean = typeof fieldNodes.find(node => !node.selected) === 'undefined';
            let nodes: Node[];

            if (alreadySelected) {
                // If all of the nodes for this field are selected, we deselect them instead
                nodes = deselectNodes(fieldNodes, state.nodes);
            } else {
                nodes = selectNodes(fieldNodes, state.nodes);
            }

            return {
                ...state,
                nodes: nodes,
				graphWorkerCacheIsValid: false
            };
        }
        case NODE_UPDATE: {
			const nodes = state.nodes.concat([]);
			const index = nodes.findIndex(node => node.id === action.node_id);

			nodes[index] = Object.assign({}, nodes[index], action.params);

			return {
				...state,
				nodes: nodes,
				graphWorkerCacheIsValid: false
			};
		}
        case SEARCH_REQUEST: {
            const searches = state.searches.concat([]);

            const datasources: string[] = action.datasourceIds;

            let search: Search = state.searches.find((search: Search) =>
                search.q === action.query
                && isEqual(search.datasources.sort(), datasources)
            );

            if (search) {
                // This exact search already exists
                return state;
            }

            let color;

            if (action.aroundNodeId === null) {
                color = getQueryColor(state.searches);
            } else {
                const node: Node = state.nodes.find(nodeLoop => nodeLoop.id === action.aroundNodeId);
                const parentSearch: Search = state.searches.find(searchLoop => searchLoop.searchId === node.searchIds[0]);
                color = darkenColor(parentSearch.color, -.3);
            }

            search = {
                q: action.query,
                color: color,
                total: 0,
                displayItems: action.displayItems,
				itemsToConfirm: [],
                requestId: action.requestId,
                completed: false,
                aroundNodeId: action.aroundNodeId,
                liveDatasource: null,
                paused: false,
                datasources: datasources,
                searchId: uniqueId(),
				error: null,
            };

            if (action.advancedQuery) {
            	search.advancedQuery = action.advancedQuery;
			}

            searches.push(search);

            // Add as the first element
			let queryHistory = state.queryHistory;

			if (!action.aroundNodeId) {
				queryHistory = [search.q].concat(state.queryHistory);

				// Delete older occurences of the query
				queryHistory = queryHistory.filter((query, index) =>
					query !== search.q || index === 0
				);
			}

            return {
                ...state,
                searches,
				queryHistory
            };
        }
        case SEARCH_FIELDS_UPDATE: {
            return {
                ...state,
                searches: action.payload.searches
            };
        }
        case GRAPH_WORKER_OUTPUT: {
        	markPerformance('graphWorkerOutput');

        	const payload: GraphWorkerOutput = action.payload;

        	if (payload.outputId !== state.expectedGraphWorkerOutputId) {
        		// Graph is outdated, soon the next update will follow so we can skip this one
        		return state;
			}

			// The search might have been deleted while the worker was busy
			const activeItemIds = new Map<string, true>();
        	state.items.forEach(item => activeItemIds.set(item.id, true));

        	let nodes = payload.nodes.map(node => ({
				...node,
				items: node.items.filter(itemId => activeItemIds.has(itemId))
			}));

        	nodes = nodes.filter(node => node.items.length > 0);
        	const links = removeDeadLinks(nodes, payload.links);

        	nodes.forEach(node => {
        		node.important = state.importantNodeIds.indexOf(node.id) !== -1
			});

        	state.notes.forEach(note => {
        		const node = nodes.find(node => node.id === note.nodeId);

        		if (node) {
        			node.description = note.note;
				}
			});

            const updates: any = {
                nodes,
                links,
				graphWorkerHasValidNodes: true,
				graphWorkerLoading: false
            };

            return Object.assign({}, state, updates);
        }

		case SEARCH_RECEIVE: {
			const newItems: Item[] = action.payload.items;

			if (!newItems || newItems.length === 0) {
				return state;
			}

			const items = state.items.concat(newItems);

			return {
				...state,
				items
			};
		}

        case REQUEST_COMPLETED: {
            const index = state.searches.findIndex(search => search.requestId === action.requestId);

            if (index === -1) {
                // Could not find out which search was completed
                return state;
            }

            const search = state.searches[index];
            const newSearch = Object.assign({}, search, { completed: true });
            const newSearches = concat([], state.searches);

            newSearches[index] = newSearch;

            return Object.assign({}, state, {
                searches: newSearches
            });
        }
        case SEARCH_EDIT: {
            const searches = concat([], state.searches);
			const datasources = action.datasources;
            const search = state.searches.find(search => search.searchId === action.searchId);
            const newSearch = Object.assign({}, search, action.opts);

            const index = searches.indexOf(search);
            searches[index] = newSearch;

            const updates: any = {
                searches: searches
            };

            if (search.displayItems !== newSearch.displayItems) {
                updates.items = markItemsForDisplay(state.items, searches, datasources);
            }

            return Object.assign({}, state, updates);
        }

        case NODES_HIGHLIGHT: {
            const nodes = markHighlightedNodes(state.nodes, action.payload.nodes);
            const links = markHighlightedLinks(nodes, state.links);

            return {
				...state,
				nodes,
				links
			};
        }

        case FIELD_NODES_HIGHLIGHT: {
            const toHighlight: Node[] = state.nodes.filter(node =>
                node.fields.indexOf(action.payload.fieldPath) !== -1
            );

            const nodes = markHighlightedNodes(state.nodes, toHighlight);

            return {
				...state,
				nodes
			};
        }

        /**
         * When a live datasource is found, we create a search for it.
         */
        case ADD_LIVE_DATASOURCE_SEARCH: {
            const existing: Search = state.searches.find(search =>
                search.liveDatasource === action.payload.datasource.id
            );

            if (typeof existing !== 'undefined') {
                // It already exists
                return state;
            }

            const newSearch: Search = {
                q: action.payload.datasource.name,
                color: getQueryColor(state.searches),
                total: 0,
                displayItems: DEFAULT_DISPLAY_ITEMS_PER_SEARCH,
				itemsToConfirm: [],
                requestId: uniqueId(),
                completed: false,
                aroundNodeId: null,
                liveDatasource: action.payload.datasource.id,
                paused: true,
                datasources: [action.payload.datasource.id],
                searchId: action.payload.datasource.id,
				error: null
            };

            return Object.assign({}, state, {
                searches: [newSearch].concat(state.searches)
            });
        }

        case ACTIVATE_LIVE_DATASOURCE: {
            const index = state.searches.findIndex(search =>
                search.liveDatasource === action.payload.datasourceId
            );

            const searches = state.searches.concat([]);
            searches[index] = Object.assign({}, searches[index], {
                paused: false
            });

            return Object.assign({}, state, {
                searches: searches
            });
        }

        case DEACTIVATE_LIVE_DATASOURCE: {
            const index = state.searches.findIndex(search =>
                search.liveDatasource === action.payload.datasourceId
            );

            const searches = state.searches.concat([]);
            searches[index] = Object.assign({}, searches[index], {
                paused: true
            });

            return Object.assign({}, state, {
                searches: searches
            });
        }

        case TOGGLE_LABELS: {
            return Object.assign({}, state, {
                showLabels: action.payload.show
            });
        }

        case SET_MAP_ACTIVE: {
            return {
                ...state,
                isMapActive: action.payload.active
            };
        }

        case SET_TIMELINE_GROUPING: {
            return {
                ...state,
                timelineGrouping: action.payload.timelineGrouping
            };
        }

		case SET_FILTER_BORING_NODES: {
			return {
				...state,
				filterBoringNodes: action.payload.enabled
			};
		}

		case SET_FILTER_SECONDARY_QUERIES: {
			return {
				...state,
				filterSecondaryQueries: action.payload.enabled
			};
		}

        case SET_IS_DRAGGING_SUB_FIELDS: {
            return {
                ...state,
                isDraggingSubFields: action.payload.enabled
            };
        }

		case SET_IMPORTANT_NODE: {
			const important: boolean = action.payload.important;
			const nodeId: number = action.payload.nodeId;
			let importantNodeIds: number[];

			if (important) {
				importantNodeIds = state.importantNodeIds.concat([]);
				importantNodeIds.push(nodeId);
			} else {
				importantNodeIds = state.importantNodeIds.filter(id =>
					id !== nodeId
				);
			}

			const nodes = state.nodes.map(node => {
				const important = importantNodeIds.indexOf(node.id) !== -1;

				if (important === node.important) {
					return node;
				}

				return {
					...node,
					important: important
				};
			});
			
			return {
				...state,
				importantNodeIds,
				nodes
			};
		}

		case SET_NOTE: {
			const note: string = action.payload.note;
			const nodeId: number = action.payload.nodeId;
			const nodes = state.nodes.concat([]);
			const index = nodes.findIndex(node => node.id === nodeId);

			nodes[index] = {
				...nodes[index],
				description: note
			};

			const notes = state.notes.concat([]);
			const noteIndex = notes.findIndex(note => note.nodeId === nodeId);

			if (noteIndex !== -1) {
				notes[noteIndex].note = note;
			} else {
				notes.push({
					nodeId,
					note
				});
			}

			return {
				...state,
				nodes,
				notes
			};
		}

		case RECEIVE_WORKSPACE: {
			const workspace: Workspace = action.payload.workspace;

			return {
				...state,
				filterSecondaryQueries: workspace.filterSecondaryQueries,
				filterBoringNodes: workspace.filterBoringNodes,
				automaticallyCreateConnectors: workspace.automaticallyCreateConnectors,
				queryHistory: workspace.queryHistory
			};
		}

		case SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID: {
			return {
				...state,
				graphWorkerLoading: true,
				expectedGraphWorkerOutputId: action.payload.id
			};
		}

		case ITEMS_NEED_CONFIRMATION: {
			const search: Search = action.payload.search;
			const items: Item[] = action.payload.items;
			const searches: Search[] = state.searches.concat([]);
			const index = searches.findIndex(loop => loop.searchId === search.searchId);

			searches[index] = {
				...searches[index],
				itemsToConfirm: searches[index].itemsToConfirm.concat(items)
			};

			return {
				...state,
				searches
			};
		}

		case CONFIRM_ITEMS:
		case DISMISS_ITEMS_TO_CONFIRM: {
			const search: Search = action.payload.search;
			const searches: Search[] = state.searches.concat([]);
			const index = searches.findIndex(loop => loop.searchId === search.searchId);

			searches[index] = {
				...searches[index],
				itemsToConfirm: []
			};

			return {
				...state,
				searches
			};
		}

		case ERROR: {
			const requestId: string = action.payload.requestId;

			if (!requestId) {
				return state;
			}

			const searches: Search[] = state.searches.concat([]);
			const index = searches.findIndex(loop => loop.requestId === requestId);

			if (index === -1) {
				return state;
			}

			searches[index] = {
				...searches[index],
				error: action.payload.error,
				completed: true
			};

			return {
				...state,
				searches
			};
		}

		case SET_AUTOMATICALLY_CREATE_CONNECTORS: {
			return {
				...state,
				automaticallyCreateConnectors: action.payload.enabled
			};
		}

		case DELETE_FROM_CONNECTOR:
		case DELETE_CONNECTOR:
		case MOVE_RULE_BETWEEN_CONNECTORS:
		case MOVE_RULE_TO_NEW_CONNECTOR: {
			return {
				...state,
				automaticallyCreateConnectors: false
			};
		}

		case SET_GROUP_NODES: {
			return {
				...state,
				groupNodes: action.payload.enabled
			};
		}

		case DONT_GROUP_NODE: {
			return {
				...state,
				noGroupingNodeIds: state.noGroupingNodeIds.concat([action.payload.node.id])
			};
		}

		case SET_FILTER_NODES_BY: {
			return {
				...state,
				filterNodesBy: action.payload.query
			};
		}

		case AUTH_CONNECTED: {
			if (action.payload.connected) {
				return state;
			}

			const searches: Search[] = state.searches.map(search => {
				if (search.completed) {
					return search;
				}

				return {
					...search,
					completed: true,
					error: 'Connection lost'
				};
			});

			return {
				...state,
				searches
			};
		}

		case SET_SEARCH_TOTAL: {
			const requestId: string = action.payload.requestId;
			const total: number = action.payload.total;

			const index = state.searches.findIndex(search =>
				search.requestId === requestId
			);

			if (index === -1) {
				return state;
			}

			const searches = state.searches.concat([]);
			searches[index] = {
				...searches[index],
				total
			};

			return {
				...state,
				searches
			};
		}

        default:
            return state;
    }
}
