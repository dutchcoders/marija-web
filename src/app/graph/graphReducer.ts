import {concat, find, isEqual, remove, uniqueId, without} from 'lodash';

import {REQUEST_COMPLETED} from '../connection/connectionConstants';
import {
    DATE_FIELD_ADD,
    DATE_FIELD_DELETE,
    FIELD_UPDATE
} from '../fields/fieldsConstants';
import {Field} from '../fields/interfaces/field';
import {sortItems} from '../items/helpers/sortItems';
import {ITEMS_RECEIVE, ITEMS_REQUEST} from '../items/itemsConstants';
import darkenColor from '../search/helpers/darkenColor';
import getQueryColor from '../search/helpers/getQueryColor';
import {Search} from '../search/interfaces/search';
import {
    ACTIVATE_LIVE_DATASOURCE,
    ADD_LIVE_DATASOURCE_SEARCH,
    DEACTIVATE_LIVE_DATASOURCE,
    SEARCH_DELETE,
    SEARCH_EDIT,
    SEARCH_FIELDS_UPDATE,
    SEARCH_REQUEST
} from '../search/searchConstants';
import {TABLE_SORT} from '../table/tableConstants';
import {
	FIELD_NODES_HIGHLIGHT,
	GRAPH_WORKER_OUTPUT,
	MAX_FIELDS,
	NODE_UPDATE,
	NODES_DELETE,
	NODES_DESELECT,
	NODES_HIGHLIGHT,
	NODES_SELECT,
	NODES_TOOLTIP,
	NORMALIZATION_ADD,
	NORMALIZATION_DELETE,
	SELECT_FIELD_NODES,
	SELECTION_CLEAR,
	SET_FIELD_PARENT,
	SET_FILTER_BORING_NODES,
	SET_FILTER_SECONDARY_QUERIES, SET_IMPORTANT_NODE,
	SET_IS_DRAGGING_SUB_FIELDS,
	SET_MAP_ACTIVE, SET_NOTE,
	SET_TIMELINE_GROUPING,
	TOGGLE_LABELS,
	VIA_ADD,
	VIA_DELETE
} from './graphConstants';
import applyVia from './helpers/applyVia';
import denormalizeLinks from './helpers/denormalizeLinks';
import denormalizeNodes from './helpers/denormalizeNodes';
import {deselectNodes} from './helpers/deselectNodes';
import markHighlightedNodes from './helpers/markHighlightedNodes';
import markLinksForDisplay from './helpers/markLinksForDisplay';
import markNodesForDisplay from './helpers/markNodesForDisplay';
import normalizeLinks from './helpers/normalizeLinks';
import normalizeNodes from './helpers/normalizeNodes';
import removeNodesAndLinks from './helpers/removeNodesAndLinks';
import removeVia from './helpers/removeVia';
import {selectNodes} from './helpers/selectNodes';
import {Node} from './interfaces/node';
import {Normalization} from './interfaces/normalization';
import {Via} from './interfaces/via';
import {GraphState} from "./interfaces/graphState";
import { markPerformance } from '../main/helpers/performance';
import { Item } from '../items/interfaces/item';
import { RECEIVE_WORKSPACE } from '../ui/uiConstants';
import { Workspace } from '../ui/interfaces/workspace';

export const defaultGraphState: GraphState = {
    date_fields: [],
    normalizations: [],
    items: [],
    searches: [],
    nodes: [], // all nodes
    links: [], // relations between nodes
    deletedNodeIds: [],
    via: [],
    showLabels: false,
    isMapActive: false,
    timelineGrouping: 'day',
    graphWorkerCacheIsValid: false,
	filterBoringNodes: true,
	filterSecondaryQueries: true,
	isDraggingSubFields: false,
	importantNodeIds: [],
	notes: []
};

export default function graphReducer(state: GraphState = defaultGraphState, action): GraphState {
    switch (action.type) {
        case NODES_DELETE: {
        	const deletedNodeIds: number[] = state.deletedNodeIds.concat([]);
        	const deleteNodeIds: number[] = action.payload.nodes.map(node => node.id);

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
        case NORMALIZATION_ADD: {
            const normalization: Normalization = {
                id: uniqueId(),
                regex: action.normalization.regex,
                replaceWith: action.normalization.replaceWith
            };

            const normalizations = state.normalizations.concat([normalization]);
            const nodes = normalizeNodes(state.nodes, normalizations);
            const links = normalizeLinks(nodes, state.links, normalizations);

            return {
                ...state,
                normalizations: normalizations,
                nodes: nodes,
                links: links,
				graphWorkerCacheIsValid: false
            };
        }
        case NORMALIZATION_DELETE: {
            const nodes = denormalizeNodes(state.nodes, action.normalization);
            const links = denormalizeLinks(state.links, action.normalization);

            return {
                ...state,
                normalizations: without(state.normalizations, action.normalization),
                nodes: nodes,
                links: links,
                graphWorkerCacheIsValid: false
            };
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
        case DATE_FIELD_ADD: {
            const existing = state.date_fields.find(search => search.path === action.field.path);

            if (typeof existing !== 'undefined') {
                return state;
            }

            return {
                ...state,
                date_fields: concat(state.date_fields, action.field)
            };
        }
        case DATE_FIELD_DELETE: {
            const dateFields: Field[] = state.date_fields.filter(field =>
                field.path !== action.field.path
            );

            return Object.assign({}, state, {
                date_fields: dateFields
            });
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
                displayNodes: action.displayNodes,
                items: [],
                requestId: action.requestId,
                completed: false,
                aroundNodeId: action.aroundNodeId,
                liveDatasource: null,
                paused: false,
                datasources: datasources,
                searchId: uniqueId()
            };

            searches.push(search);

            return {
                ...state,
                searches: searches
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

        	action.nodes.forEach(node => {
        		node.important = state.importantNodeIds.indexOf(node.id) !== -1
			});

        	state.notes.forEach(note => {
        		const node = action.nodes.find(node => node.id === note.nodeId);

        		if (node) {
        			node.description = note.note;
				}
			});

            const updates: any = {
                nodes: action.nodes,
                links: action.links,
                items: action.items,
                searches: action.searches,
				graphWorkerHasValidNodes: true
            };

            return Object.assign({}, state, updates);
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

            const search = state.searches.find(search => search.searchId === action.searchId);
            const newSearch = Object.assign({}, search, action.opts);

            const index = searches.indexOf(search);
            searches[index] = newSearch;

            const updates: any = {
                searches: searches
            };

            if (search.displayNodes !== newSearch.displayNodes) {
                updates.nodes = markNodesForDisplay(state.nodes, searches);
                updates.links = markLinksForDisplay(updates.nodes, state.links);
            }

            return Object.assign({}, state, updates);
        }

        case NODES_HIGHLIGHT: {
            const nodes = markHighlightedNodes(state.nodes, action.nodes);

            return Object.assign({}, state, {
                nodes: nodes
            });
        }

        case FIELD_NODES_HIGHLIGHT: {
            const toHighlight: Node[] = state.nodes.filter(node =>
                node.fields.indexOf(action.payload.fieldPath) !== -1
            );

            const nodes = markHighlightedNodes(state.nodes, toHighlight);

            return Object.assign({}, state, {
                nodes: nodes
            });
        }

        case ITEMS_REQUEST: {
            const newItems = state.items.concat([]);

            action.items.forEach(item => {
                const index = state.items.findIndex(search => search.id === item.id);

                newItems[index] = Object.assign({}, newItems[index], {
                    requestedExtraData: true
                });
            });

            return {
                ...state,
                items: newItems,
				graphWorkerCacheIsValid: false
            };
        }
        case ITEMS_RECEIVE: {
            if (!action.payload.items || !action.payload.items.length) {
                return state;
            }

            let nodes: Node[] = state.nodes.concat([]);

            action.payload.items.forEach(item => item.receivedExtraData = true);

			let items = state.items.concat([]);

            // We might need to delete the previous item
            if (action.payload.prevItemId) {
            	const prevItem = items.find(item => item.id === action.payload.prevItemId);
                items = items.filter(item => item.id !== action.payload.prevItemId);

                const newItems: Item[] = action.payload.items.map(item => {
                	return {
						...prevItem,
						...item,
					}
				});

                items = items.concat(newItems);

                nodes = nodes.map(node => {
                    const itemIndex = node.items.indexOf(action.payload.prevItemId);

                    if (itemIndex === -1) {
                        return node;
                    }

                    const itemIds = node.items.concat([]);
                    itemIds[itemIndex] = action.payload.items[0].id;

                    return Object.assign({}, node, {
                        items: itemIds
                    });
                });
            }

            if (action.payload.sortColumn) {
                items = sortItems(items, action.payload.sortColumn, action.payload.sortType);
            }

            return {
                ...state,
                nodes: nodes,
                items: items,
				graphWorkerCacheIsValid: false
            };
        }

        case TABLE_SORT: {
            const items = sortItems(state.items, action.payload.column, action.payload.type);

            return {
                ...state,
                items: items,
				graphWorkerCacheIsValid: false
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
                displayNodes: 500,
                items: [],
                requestId: uniqueId(),
                completed: false,
                aroundNodeId: null,
                liveDatasource: action.payload.datasource.id,
                paused: true,
                datasources: [action.payload.datasource.id],
                searchId: action.payload.datasource.id
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
				date_fields: workspace.dateFields
			};
		}

        default:
            return state;
    }
}
