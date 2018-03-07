import { slice, concat, without, reduce, remove, assign, find, forEach, union, filter, uniqBy, uniqueId, intersection, isEqual } from 'lodash';

import {  ERROR, AUTH_CONNECTED, Socket, SearchMessage, DiscoverIndicesMessage, DiscoverFieldsMessage } from '../utils/index';
import {  FIELDS_RECEIVE, FIELDS_REQUEST } from '../modules/fields/index';
import {  NODES_DELETE, NODES_HIGHLIGHT, NODE_UPDATE, NODES_SELECT, NODES_DESELECT, SELECTION_CLEAR } from '../modules/graph/index';
import {
    FIELD_NODES_HIGHLIGHT,
    GRAPH_WORKER_OUTPUT
} from '../modules/graph/constants';
import {  SEARCH_DELETE, SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_EDIT } from '../modules/search/index';
import {  TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, FIELD_ADD, FIELD_UPDATE, FIELD_DELETE, DATE_FIELD_ADD, DATE_FIELD_DELETE, NORMALIZATION_ADD, NORMALIZATION_DELETE, INITIAL_STATE_RECEIVE } from '../modules/data/index';

import {
    normalize, fieldLocator, getNodesForDisplay,
    removeDeadLinks, applyVia, getQueryColor, getConnectedComponents,
    filterSecondaryComponents, deleteFieldFromNodes
} from '../helpers/index';
import removeNodesAndLinks from "../helpers/removeNodesAndLinks";
import {VIA_ADD, VIA_DELETE} from "../modules/data/constants";
import {NODES_TOOLTIP, SET_SELECTING_MODE} from "../modules/graph/constants";
import {REQUEST_COMPLETED} from "../utils/constants";
import filterBoringComponents from "../helpers/filterBoringComponents";
import {SEARCH_FIELDS_UPDATE} from "../modules/search/constants";
import {cancelRequest} from "./utils";
import {Node} from '../interfaces/node';
import getNodesAndLinks from '../helpers/getNodesAndLinks';
import {Link} from "../interfaces/link";
import {Item} from "../interfaces/item";
import {Search} from "../interfaces/search";
import {ITEMS_RECEIVE, ITEMS_REQUEST} from "../modules/items/constants";
import normalizeNodes from "../helpers/normalizeNodes";
import {Normalization} from "../interfaces/normalization";
import normalizeLinks from "../helpers/normalizeLinks";
import denormalizeNodes from "../helpers/denormalizeNodes";
import denormalizeLinks from "../helpers/denormalizeLinks";
import getLinksForDisplay from "../helpers/getLinksForDisplay";
import darkenColor from "../helpers/darkenColor";
import {Column} from "../interfaces/column";
import createField from "../helpers/createField";
import {Field} from "../interfaces/field";
import {Via} from "../interfaces/via";
import removeVia from "../helpers/removeVia";
import {DATASOURCE_ACTIVATED, DATASOURCE_DEACTIVATED} from "../modules/datasources/constants";
import {Datasource} from "../interfaces/datasource";
import markHighlightedNodes from "../helpers/markHighlightedNodes";
import datasources from "./datasources";

interface State {
    connected: boolean;
    total: number;
    datasources: any[];
    columns: Column[];
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
}

export const defaultState: State = {
    connected: false,
    total: 0,
    datasources: [],
    columns: [],
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
    selectingMode: false
};

export default function entries(state: State = defaultState, action) {
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
            const searches = state.searches.filter(search => search.q !== toDelete.q);
            let items = concat(state.items);

            if (!toDelete.completed) {
                // Tell the server it can stop sending results for this query
                cancelRequest(toDelete['request-id']);
            }

            items = items.filter(item => item.query !== toDelete.q);

            const { nodes, links } = removeNodesAndLinks(state.nodes, state.links, toDelete.q);

            return Object.assign({}, state, {
                searches: searches,
                items: items,
                nodes: nodes,
                links: links
            });
        }
        case TABLE_COLUMN_ADD:
            return Object.assign({}, state, {
                columns: concat(state.columns, action.field),
            });
        case TABLE_COLUMN_REMOVE:
            return Object.assign({}, state, {
                columns: without(state.columns, action.field)
            });
        case FIELD_ADD:
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

            let columns = state.columns;

            if (columns.length < 3) {
                columns = columns.concat([newField.path]);
            }

            return Object.assign({}, state, {
                fields: concat(state.fields, newField),
                date_fields: dateFields,
                columns: columns
            });
        case FIELD_UPDATE: {
            const index: number = state.fields.findIndex(search  => search.path === action.fieldPath);
            const fields: Field[] = state.fields.concat([]);

            fields[index] = Object.assign({}, fields[index], action.updates);

            let nodes: Node[] = state.nodes;

            // If the icon was updates, also delete all the icons of the affected nodes
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

            return Object.assign({}, state, {
                fields: without(state.fields, action.field),
                nodes: nodes,
                links: links
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
                endpoints: action.via.endpoints,
                label: action.via.label,
                id: uniqueId()
            };

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
            const select: Node[] = action.nodes.filter(node => !node.selected);
            const nodes: Node[] = state.nodes.concat([]);

            select.forEach(node => {
                const index = nodes.findIndex(search => search.id === node.id);

                if (!nodes[index].selected) {
                    nodes[index] = Object.assign({}, node, {
                        selected: true
                    });
                }
            });

            return Object.assign({}, state, {
                nodes: nodes
            });
        }
        case NODES_DESELECT: {
            const nodes: Node[] = state.nodes.concat([]);

            action.nodes.forEach(node => {
                const index = nodes.findIndex(search =>
                    search.selected
                    && search.id === node.id
                );

                if (index !== -1) {
                    nodes[index] = Object.assign({}, node, {
                        selected: false
                    });
                }
            });

            return Object.assign({}, state, {
                nodes: nodes
            });
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
        case NODE_UPDATE:
            let nodes = concat(state.nodes, []);

            let n = find(nodes, {id: action.node_id });
            if (n) {
                n = assign(n, action.params);
            }

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
            // if we searched before, just retrieve extra results for query
            // const search = find(state.searches, (o) => o.q == action.query) || { items: [] };
            const searches = concat(state.searches, []);

            let search = find(state.searches, (o) => o.q === action.query);

            if (!search) {
                let color;

                if (action.aroundNodeId === null) {
                    color = getQueryColor(state.searches);
                } else {
                    const node: Node = state.nodes.find(nodeLoop => nodeLoop.id === action.aroundNodeId);
                    const parentSearch: Search = state.searches.find(searchLoop => searchLoop.q === node.queries[0]);
                    color = darkenColor(parentSearch.color, -.3);
                }

                search = {
                    q: action.query,
                    color: color,
                    total: 0,
                    displayNodes: action.displayNodes,
                    items: [],
                    requestId: uniqueId(),
                    completed: false,
                    aroundNodeId: action.aroundNodeId,
                    liveDatasource: null
                };

                searches.push(search);
            }

            let fieldPaths: string[] = state.fields.map(field => field.path);
            fieldPaths = fieldPaths.concat(state.date_fields.map(field => field.path));

            const datasources: string[] = action
                .datasources
                .filter(datasource => datasource.active)
                .map(datasource => datasource.id);

            let message = {
                datasources: datasources,
                query: action.query,
                fields: fieldPaths,
                'request-id': search.requestId
            };
            Socket.ws.postMessage(message);

            return Object.assign({}, state, {
                searches: searches
            });
        }
        case SEARCH_FIELDS_UPDATE: {
            let fields = state.fields.map(field => field.path);
            fields = fields.concat(state.date_fields.map(field => field.path));
            const datasources = state.datasources.map(datasource => datasource.id);

            const newSearches = state.searches.map(search => {
                cancelRequest(search.requestId);

                const newRequestId = uniqueId();

                Socket.ws.postMessage({
                    datasources: datasources,
                    query: search.q,
                    fields: fields,
                    'request-id': newRequestId
                });

                return Object.assign({}, search, {
                    requestId: newRequestId,
                    completed: false
                });
            });

            return Object.assign({}, state, {
                searches: newSearches
            });
        }
        case GRAPH_WORKER_OUTPUT: {
            const updates: any = {
                nodes: action.nodes,
                links: action.links,
                items: action.items
            };

            // Fields are only updated by the graph worker if it was a live search
            // In a live search all fields present in the items are automatically
            // added
            if (!isEqual(action.fields, state.fields)) {
                updates.fields = action.fields;
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

            const search = state.searches.find(search => search.q === action.query);
            const newSearch = Object.assign({}, search, action.opts);

            const index = searches.indexOf(search);
            searches[index] = newSearch;

            const updates: any = {
                searches: searches
            };

            if (search.displayNodes !== newSearch.displayNodes) {
                updates.nodes = getNodesForDisplay(state.nodes, searches);
                updates.links = getLinksForDisplay(updates.nodes, state.links);
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
            const message = {
                'request-id': uniqueId(),
                items: action.items.map(item => item.id)
            };

            Socket.ws.postMessage(message, ITEMS_REQUEST);

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
            if (!action.items) {
                return state;
            }

            const nodes: Node[] = state.nodes.concat([]);

            action.items.forEach((item: Item) => {
                forEach(item.fields, value => {
                    const index = nodes.findIndex(node => node.id === value);

                    if (index === -1) {
                        return;
                    }

                    nodes[index] = Object.assign({}, nodes[index], {
                        items: nodes[index].items.concat([item.id])
                    });
                });
            });

            let items = state.items.concat(action.items);

            // We might need to delete the previous item
            if (action.prevItemId) {
                items = items.filter(item => item.id !== action.prevItemId);
            }

            return Object.assign({}, state, {
                nodes: nodes,
                items: items
            });
        }

        /**
         * When a live datasource is activated, we create a search for it.
         */
        case DATASOURCE_ACTIVATED: {
            const datasource: Datasource = action.payload.datasource;

            if (datasource.type !== 'live') {
                return state;
            }

            const search: Search = state.searches.find(search => search.liveDatasource === datasource.id);

            if (typeof search !== 'undefined') {
                return state;
            }

            const newSearch = {
                q: action.payload.datasource.name,
                color: '#0055cc',
                total: 0,
                displayNodes: 500,
                items: [],
                requestId: uniqueId(),
                completed: false,
                aroundNodeId: null,
                liveDatasource: action.payload.datasource.id
            };

            return Object.assign({}, state, {
                searches: state.searches.concat([newSearch])
            });
        }

        default:
            return state;
    }
}
