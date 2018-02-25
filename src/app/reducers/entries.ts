import { slice, concat, without, reduce, remove, assign, find, forEach, union, filter, uniqBy, uniqueId, intersection } from 'lodash';

import {  ERROR, AUTH_CONNECTED, Socket, SearchMessage, DiscoverIndicesMessage, DiscoverFieldsMessage } from '../utils/index';

import {  INDICES_RECEIVE, INDICES_REQUEST } from '../modules/indices/index';
import {  FIELDS_RECEIVE, FIELDS_REQUEST } from '../modules/fields/index';
import {  NODES_DELETE, NODES_HIGHLIGHT, NODE_UPDATE, NODES_SELECT, NODES_DESELECT, SELECTION_CLEAR } from '../modules/graph/index';
import {  SEARCH_DELETE, SEARCH_RECEIVE, SEARCH_REQUEST, SEARCH_EDIT } from '../modules/search/index';
import {  TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, INDEX_ADD, INDEX_DELETE, FIELD_ADD, FIELD_DELETE, DATE_FIELD_ADD, DATE_FIELD_DELETE, NORMALIZATION_ADD, NORMALIZATION_DELETE, INITIAL_STATE_RECEIVE } from '../modules/data/index';

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
import {LIVE_RECEIVE} from "../modules/live/constants";
import createField from "../helpers/createField";
import {Field} from "../interfaces/field";

interface State {
    isFetching: boolean;
    itemsFetching: boolean;
    noMoreHits: boolean;
    didInvalidate: boolean;
    connected: boolean;
    total: number;
    datasources: any[];
    columns: Column[];
    fields: Field[];
    date_fields: Field[];
    normalizations: Normalization[];
    indexes: any[];
    items: Item[];
    searches: Search[];
    nodes: Node[];
    links: Link[]; // relations between nodes
    deletedNodes: Node[];
    errors: any;
    via: any[];
    version: string;
    selectingMode: boolean;
}

export const defaultState: State = {
    isFetching: false,
    itemsFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    connected: false,
    total: 0,
    datasources: [],
    columns: [],
    fields: [],
    date_fields: [],
    normalizations: [], 
    indexes: [],
    items: [],
    searches: [],
    nodes: [], // all nodes
    links: [], // relations between nodes
    deletedNodes: [],
    errors: null,
    via: [],
    version: '',
    selectingMode: false
};

export default function entries(state: State = defaultState, action) {
    switch (action.type) {
        case INDEX_DELETE:
            const index = find(state.indexes, (i) => {
                return (i.id == action.index);
            });

            var indexes = without(state.indexes, index);
            return Object.assign({}, state, {
                indexes: indexes,
            });
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
        case SEARCH_DELETE:
            const searches = without(state.searches, action.search);
            var items = concat(state.items);

            if (!action.search.completed) {
                // Tell the server it can stop sending results for this query
                Socket.ws.postMessage(
                    {
                        'request-id': action.search['request-id']
                    },
                    INDICES_REQUEST
                );
            }

            items = items.filter(item => item.query !== action.search.q);

            // todo(nl5887): remove related nodes and links
            const result = removeNodesAndLinks(state.nodes, state.links, action.search.q);

            return Object.assign({}, state, {
                searches: searches,
                items: items,
                nodes: result.nodes,
                links: result.links,
                tooltipNodes: []
            });
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

            const newField = createField(state.fields, action.field.path, action.field.type);

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
        case VIA_ADD:
            return Object.assign({}, state, {
                via: concat(state.via, action.via)
            });
        case VIA_DELETE:
            return Object.assign({}, state, {
                via: without(state.via, action.via)
            });
        case DATE_FIELD_ADD: {
            const existing = state.date_fields.find(search => search.path === action.field.path);

            if (typeof existing !== 'undefined') {
                return state;
            }

            return Object.assign({}, state, {
                date_fields: concat(state.date_fields, action.field)
            });
        }
        case DATE_FIELD_DELETE:
            return Object.assign({}, state, {
                date_fields: without(state.date_fields, action.field)
            });
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
                isFetching: false,
                didInvalidate: false,
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

            let fieldPaths = action.fields.map(field => field.path);
            fieldPaths = fieldPaths.concat(state.date_fields.map(field => field.path))

            let message = {
                datasources: action.datasources,
                query: action.query,
                fields: fieldPaths,
                'request-id': search.requestId
            };
            Socket.ws.postMessage(message);

            return Object.assign({}, state, {
                isFetching: true,
                itemsFetching: true,
                didInvalidate: false,
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
        case LIVE_RECEIVE: {
            console.log(state.indexes);

            let searches = state.searches;
            let search: Search = searches.find(search => search.liveDatasource === action.datasource);

            if (typeof search === 'undefined') {
                search = {
                    q: action.datasource,
                    color: '#0055cc',
                    total: 0,
                    displayNodes: 500,
                    items: [],
                    requestId: uniqueId(),
                    completed: false,
                    aroundNodeId: null,
                    liveDatasource: action.datasource
                };

                searches = searches.concat([search])
            }

            const items = action.graphs || [];

            console.log(items);

            search.items = concat(search.items, items);

            // Save per item for which query we received it (so we can keep track of where data came from)
            items.forEach(item => {
                item.query = search.q;
            });

            let fields = state.fields;
            items.forEach(item => {
                forEach(item.fields, (value, key) => {
                    const existing: Field = fields.find(field => field.path === key);

                    if (typeof existing === 'undefined') {
                        const field = createField(state.fields, key, 'string');
                        console.log('add', field);
                        fields = fields.concat([field]);
                    }
                });
            });

            // update nodes and links
            const result = getNodesAndLinks(
                state.nodes,
                state.links,
                items,
                fields,
                search,
                state.normalizations,
                search.aroundNodeId,
                state.deletedNodes
            );

            const normalizedNodes = normalizeNodes(result.nodes, state.normalizations);
            const normalizedLinks = normalizeLinks(result.links, state.normalizations);

            result.nodes = normalizedNodes;
            result.links = removeDeadLinks(result.nodes, normalizedLinks);

            let { nodes, links } = applyVia(result.nodes, result.links, state.via);
            nodes = getNodesForDisplay(nodes, state.searches || []);
            links = getLinksForDisplay(nodes, links);

            return Object.assign({}, state, {
                errors: null,
                nodes: nodes,
                links: links,
                items: concat(state.items, items),
                searches: searches,
                isFetching: false,
                itemsFetching: false,
                didInvalidate: false,
                fields: fields
            });
        }

        case SEARCH_RECEIVE: {
            const searches = concat(state.searches, []);
            const items = action.items.results === null ? [] : action.items.results;

            // should we update existing search, or add new, do we still need items?
            let search = find(state.searches, (o) => o.q === action.items.query);
            if (search) {
                search.items = concat(search.items, action.items.results);
            } else {
                console.error('received items for a query we were not searching for: ' + action.items.query);
                return state;
            }

            // Save per item for which query we received it (so we can keep track of where data came from)
            items.forEach(item => {
                item.query = search.q;
            });

            // todo(nl5887): should we start a webworker here, the webworker can have its own permanent cache?

            // update nodes and links
            const result = getNodesAndLinks(
                state.nodes,
                state.links,
                items,
                state.fields,
                search,
                state.normalizations,
                search.aroundNodeId,
                state.deletedNodes
            );

            const normalizedNodes = normalizeNodes(result.nodes, state.normalizations);
            const normalizedLinks = normalizeLinks(result.links, state.normalizations);

            result.nodes = normalizedNodes;
            result.links = removeDeadLinks(result.nodes, normalizedLinks);

            const components = getConnectedComponents(result.nodes, result.links);
            const filtered = filterBoringComponents(components);
            result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
            result.links = removeDeadLinks(result.nodes, result.links);

            if (state.searches.length > 1) {
                // If there is more than 1 query, all nodes for subsequent queries
                // need to be linked to nodes from the first query
                // If some results are not linked, they will not be displayed as nodes

                const components = getConnectedComponents(result.nodes, result.links);
                const primaryQuery = state.searches[0].q;
                const filtered = filterSecondaryComponents(primaryQuery, components);
                result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
                result.links = removeDeadLinks(result.nodes, result.links);
            }

            let { nodes, links } = applyVia(result.nodes, result.links, state.via);
            nodes = getNodesForDisplay(nodes, state.searches || []);
            links = getLinksForDisplay(nodes, links);

            return Object.assign({}, state, {
                errors: null,
                nodes: nodes,
                links: links,
                items: concat(state.items, items),
                searches: searches,
                isFetching: false,
                itemsFetching: false,
                didInvalidate: false
            });
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
        case INDICES_REQUEST:
            Socket.ws.postMessage(
                {
                    host: [action.payload.server]
                },
                INDICES_REQUEST
            );

            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });

        case INDICES_RECEIVE:
            const indices = uniqBy(union(state.indexes, action.payload.indices.map((index) => {
                return {
                    id: `${action.payload.server}${index}`,
                    server: action.payload.server,
                    name: index
                };
            })), (i) => i.id);

            return Object.assign({}, state, {
                indexes: indices,
                isFetching: false
            });

        case FIELDS_REQUEST:
            return Object.assign({}, state, {
                isFetching: true
            });

        case FIELDS_RECEIVE:
            return Object.assign({}, state, {
                isFetching: false
            });

        case INITIAL_STATE_RECEIVE: {
            console.log(action);

            return Object.assign({}, state, {
                datasources: action.initial_state.datasources,
                version: action.initial_state.version
            });
        }
        case SET_SELECTING_MODE:
            return Object.assign({}, state, {
                selectingMode: action.selectingMode
            });

        case NODES_HIGHLIGHT: {
            const nodes = state.nodes.concat([]);
            const ids = action.nodes.map(node => node.id);

            nodes.forEach((node, index) => {
                const shouldHighlight = ids.indexOf(node.id) !== -1;

                if (shouldHighlight && !node.highlighted) {
                    // Add new highlight
                    nodes[index] = Object.assign({}, node, {
                        highlighted: true
                    });
                } else if (!shouldHighlight && node.highlighted) {
                    // Remove previous highlight
                    nodes[index] = Object.assign({}, node, {
                        highlighted: false
                    });
                }
            });

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

            return Object.assign({}, state, {
                nodes: nodes,
                items: state.items.concat(action.items)
            });
        }

        default:
            return state;
    }
}
