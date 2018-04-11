import { concat, without, remove, assign, find, uniqueId, isEqual, chunk } from 'lodash';

import {  ERROR, AUTH_CONNECTED} from '../../utils/index';
import {  NODES_DELETE, NODES_HIGHLIGHT, NODE_UPDATE, NODES_SELECT, NODES_DESELECT, SELECTION_CLEAR } from './index';
import {
    FIELD_NODES_HIGHLIGHT,
    GRAPH_WORKER_OUTPUT,
    SELECT_FIELD_NODES
} from './graphConstants';
import {  SEARCH_DELETE, ACTIVATE_LIVE_DATASOURCE, DEACTIVATE_LIVE_DATASOURCE, SEARCH_REQUEST, SEARCH_EDIT } from '../search/searchConstants';
import {  ADD_LIVE_DATASOURCE_SEARCH } from '../search/searchConstants';
import { FIELD_ADD, FIELD_UPDATE, FIELD_DELETE, DATE_FIELD_ADD, DATE_FIELD_DELETE, NORMALIZATION_ADD, NORMALIZATION_DELETE, INITIAL_STATE_RECEIVE } from '../data/index';

import { getQueryColor,
} from '../../helpers/index';
import removeNodesAndLinks from "./helpers/removeNodesAndLinks";
import {VIA_ADD, VIA_DELETE} from "../data/constants";
import {NODES_TOOLTIP, SET_SELECTING_MODE, TOGGLE_LABELS} from "./graphConstants";
import {REQUEST_COMPLETED} from "../../utils/utilsConstants";
import {SEARCH_FIELDS_UPDATE} from "../search/searchConstants";
import {Node} from './interfaces/node';
import {Link} from "./interfaces/link";
import {Item} from "./interfaces/item";
import {Search} from "../search/interfaces/search";
import {ITEMS_RECEIVE, ITEMS_REQUEST} from "../items/tableConstants";
import normalizeNodes from "./helpers/normalizeNodes";
import {Normalization} from "./interfaces/normalization";
import normalizeLinks from "./helpers/normalizeLinks";
import denormalizeNodes from "./helpers/denormalizeNodes";
import denormalizeLinks from "./helpers/denormalizeLinks";
import darkenColor from "../search/helpers/darkenColor";
import createField from "../fields/helpers/createField";
import {Field} from "../fields/interfaces/field";
import {Via} from "./interfaces/via";
import removeVia from "./helpers/removeVia";
import markHighlightedNodes from "./helpers/markHighlightedNodes";
import markLinksForDisplay from "./helpers/markLinksForDisplay";
import markNodesForDisplay from "./helpers/markNodesForDisplay";
import {sortItems} from "../items/helpers/sortItems";
import {selectNodes} from "./helpers/selectNodes";
import {deselectNodes} from "./helpers/deselectNodes";
import {TABLE_SORT} from "../table/tableConstants";
import deleteFieldFromNodes from './helpers/deleteFieldFromNodes';
import removeDeadLinks from './helpers/removeDeadLinks';
import applyVia from './helpers/applyVia';

export interface GraphState {
    connected: boolean;
    total: number;
    fields: Field[];
    date_fields: Field[];
    normalizations: Normalization[];
    items: Item[];
    searches: Search[];
    nodes: Node[];
    links: Link[]; // relations between nodes
    deletedNodes: Node[];
    errors: any;
    via: Via[];
    selectingMode: boolean;
    showLabels: boolean;
}

export const defaultGraphState: GraphState = {
    connected: false,
    total: 0,
    fields: [],
    date_fields: [],
    normalizations: [],
    items: [],
    searches: [],
    nodes: [], // all nodes
    links: [], // relations between nodes
    deletedNodes: [],
    errors: null,
    via: [],
    selectingMode: false,
    showLabels: false
};

export default function graphReducer(state: GraphState = defaultGraphState, action): GraphState {
    switch (action.type) {
        case NODES_DELETE: {
            const items = concat([], state.items);
            const nodes = concat([], state.nodes);
            const links = concat([], state.links);

            remove(nodes, (p) => {
                return find(action.nodes, (o) => {
                    return o.id == p.id;
                });
            });

            remove(links, (p) => {
                return find(action.nodes, (o) => {
                    return p.source == o.id || p.target == o.id;
                });
            });

            return Object.assign({}, state, {
                items: items,
                nodes: nodes,
                links: links,
                deletedNodes: state.deletedNodes.concat(action.nodes)
            });
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
                links: links
            });
        }
        case FIELD_ADD: {
            const existing = state.fields.find(field => field.path === action.field.path);

            if (existing) {
                // Field was already in store, don't add duplicates
                return state;
            }

            const newField = createField(state.fields, action.field.path, action.field.type, action.field.datasourceId);

            let dateFields = concat([], state.date_fields);

            if (action.field.type === 'date'
                && typeof dateFields.find(search => search.path === newField.path) === 'undefined') {
                dateFields.push(newField);
            }

            return {
                ...state,
                fields: state.fields.concat([newField]),
                date_fields: dateFields
            };
        }

        case FIELD_UPDATE: {
            const index: number = state.fields.findIndex(search  => search.path === action.fieldPath);
            const fields: Field[] = state.fields.concat([]);

            fields[index] = Object.assign({}, fields[index], action.updates);

            let nodes: Node[] = state.nodes;

            // If the icon was updated, also update the icons of all the affected nodes
            if (action.updates.icon) {
                nodes = state.nodes.map(node => {
                    const isAffected: boolean =
                        node.fields.length === 1
                        && node.fields.indexOf(action.fieldPath) !== -1;

                    if (isAffected) {
                        return Object.assign({}, node, {
                            icon: action.updates.icon
                        });
                    }

                    return node;
                });
            }

            return Object.assign({}, state, {
                fields: fields,
                nodes: nodes
            });
        }
        case FIELD_DELETE: {
            const nodes = deleteFieldFromNodes(action.field.path, state.nodes);
            const links = removeDeadLinks(nodes, state.links);

            return {
                ...state,
                fields: without(state.fields, action.field),
                nodes: nodes,
                links: links
            };
        }
        case NORMALIZATION_ADD: {
            const normalization: Normalization = {
                id: uniqueId(),
                regex: action.normalization.regex,
                replaceWith: action.normalization.replaceWith
            };

            const normalizations = state.normalizations.concat([normalization]);
            const nodes = normalizeNodes(state.nodes, normalizations);
            const links = normalizeLinks(state.links, normalizations);

            return Object.assign({}, state, {
                normalizations: normalizations,
                nodes: nodes,
                links: links
            });
        }
        case NORMALIZATION_DELETE: {
            const nodes = denormalizeNodes(state.nodes, action.normalization);
            const links = denormalizeLinks(state.links, action.normalization);

            return Object.assign({}, state, {
                normalizations: without(state.normalizations, action.normalization),
                nodes: nodes,
                links: links
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
                links: links
            });
        }
        case VIA_DELETE: {
            const via: Via[] = state.via.filter(search => search.id !== action.via.id);
            const { nodes, links } = removeVia(state.nodes, state.links, action.via);

            return Object.assign({}, state, {
                via: via,
                nodes: nodes,
                links: links
            });
        }
        case DATE_FIELD_ADD: {
            const existing = state.date_fields.find(search => search.path === action.field.path);

            if (typeof existing !== 'undefined') {
                return state;
            }

            return Object.assign({}, state, {
                date_fields: concat(state.date_fields, action.field)
            });
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
                nodes: nodes
            };
        }
        case NODES_DESELECT: {
            const nodes: Node[] = deselectNodes(action.nodes, state.nodes);

            return {
                ...state,
                nodes: nodes
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

            return Object.assign({}, state, {
                nodes: nodes
            });
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
                nodes: nodes
            };
        }
        case NODE_UPDATE:
            const nodes = state.nodes.concat([]);
            const index = nodes.findIndex(node => node.id === action.node_id);

            nodes[index] = Object.assign({}, nodes[index], action.params);

            return Object.assign({}, state, {
                nodes: nodes
            });
        case ERROR:
            console.debug(action);
            return Object.assign({}, state, {
                errors: action.errors
            });
        case AUTH_CONNECTED:
            return Object.assign({}, state, {
                ...action
            });
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
            const updates: any = {
                nodes: action.nodes,
                links: action.links,
                items: action.items,
                searches: action.searches
            };

            // Fields are only updated by the graph worker if it was a live search
            // In a live search all fields present in the items are automatically
            // added
            if (!isEqual(action.fields, state.fields)) {
                const newFields = action.fields.filter((field: Field) =>
                    state.fields.findIndex(existing => existing.path === field.path) === -1
                );

                updates.fields = state.fields.concat(newFields);
            }

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

        case SET_SELECTING_MODE:
            return Object.assign({}, state, {
                selectingMode: action.selectingMode
            });

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

            return Object.assign({}, state, {
                items: newItems
            });
        }
        case ITEMS_RECEIVE: {
            if (!action.payload.items) {
                return state;
            }

            let nodes: Node[] = state.nodes.concat([]);
            let items = state.items.concat(action.payload.items);

            // We might need to delete the previous item
            if (action.payload.prevItemId) {
                items = items.filter(item => item.id !== action.payload.prevItemId);

                nodes = nodes.map(node => {
                    const itemIndex = node.items.indexOf(action.payload.prevItemId);

                    if (itemIndex === -1) {
                        return node;
                    }

                    const itemIds = node.items.concat([]);
                    itemIds[itemIndex] = action.items[0].id;

                    return Object.assign({}, node, {
                        items: itemIds
                    });
                });
            }

            if (action.payload.sortColumn) {
                items = sortItems(items, action.payload.sortColumn, action.payload.sortType);
            }

            return Object.assign({}, state, {
                nodes: nodes,
                items: items
            });
        }

        case TABLE_SORT: {
            const items = sortItems(state.items, action.payload.column, action.payload.type);

            return {
                ...state,
                items: items
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



        default:
            return state;
    }
}
