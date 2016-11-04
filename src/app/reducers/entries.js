import { concat, without, reduce, remove, find, forEach } from 'lodash';

import {  DELETE_NODES, HIGHLIGHT_NODES, SELECT_NODE, SELECT_NODES, CLEAR_SELECTION } from '../modules/graph/index'
import {  DELETE_SEARCH, RECEIVE_ITEMS, REQUEST_ITEMS } from '../modules/search/index'
import {  ERROR, AUTH_CONNECTED, Socket } from '../utils/index'
import {  TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, ADD_INDEX, DELETE_INDEX, ADD_FIELD, DELETE_FIELD } from '../modules/data/index'

import { normalize, fieldLocator } from '../helpers/index'

export const defaultState = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    connected: false,
    total: 0,
    node: [],
    highlight_nodes: [],
    columns: [],
    errors: null,
    fields: [],
    indexes: [],
    items: [],
    searches: [],

    nodes: [], // all nodes
    links: [], // relations between nodes
}

export default function entries(state = defaultState, action) {
    console.debug("STATE", state);

    switch (action.type) {
        case CLEAR_SELECTION:
            return Object.assign({}, state, {
                node: [],
            })
        case ADD_INDEX:
            var indexes = concat(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            })
        case DELETE_INDEX:
            var indexes = without(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            })
        case DELETE_NODES:
            var items = concat(state.items);
            var node = concat(state.node);
            var nodes = concat(state.nodes);
            var links = concat(state.links);

            // remove from selection as well
            remove(node, (p) => {
                return find(action.nodes, (o) => {
                    return o == p.id;
                });
            });

            remove(nodes, (p) => {
                return find(action.nodes, (o) => {
                    return o == p.id;
                });
            });

            remove(links, (p) => {
                return find(action.nodes, (o) => {
                    return p.source == o || p.target == o;
                });
            });

            return Object.assign({}, state, {
                items: items,
                node: node,
                nodes: nodes,
                links: links
            })
        case DELETE_SEARCH:
            var searches = without(state.searches, action.search);

            var items = concat(state.items);
            remove(items, (p) => {
                return (p.q === action.search.q)
            });

            // todo(nl5887): remove related nodes and links

            return Object.assign({}, state, {
                searches: searches,
                items: items
            });
            break;
        case TABLE_COLUMN_ADD:
            return Object.assign({}, state, {
                columns: concat(state.columns, action.field),
            });
            break;
        case TABLE_COLUMN_REMOVE:
            return Object.assign({}, state, {
                columns: without(state.columns, action.field)
            });
            break;
        case ADD_FIELD:
            return Object.assign({}, state, {
                fields: concat(state.fields, action.field)
            });
            break;
        case DELETE_FIELD:
            return Object.assign({}, state, {
                fields: without(state.fields, action.field)
            });
            break;
        case HIGHLIGHT_NODES:
            return Object.assign({}, state, {
                highlight_nodes: action.nodes
            });
            break;
        case SELECT_NODES:
            return Object.assign({}, state, {
                node: concat(action.nodes)
            });
            break;
        case SELECT_NODE:
            return Object.assign({}, state, {
                node: concat(state.node, action.node)
            });
            break;
        case ERROR:
            return Object.assign({}, state, {
                ...action
            });
            break;
        case AUTH_CONNECTED:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                ...action
            });
            break;
        case REQUEST_ITEMS:
            Socket.ws.postMessage({query: action.query, index: action.index, color: action.color});
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });
            break;
        case RECEIVE_ITEMS:
            var searches = concat(state.searches, {
                q: action.items.query,
                color: action.items.color,
                count: action.items.results.hits.hits.length
            });

            // update nodes and links
            var nodes = concat(state.nodes, []);
            var links = concat(state.links, []);

            var items = [];
            forEach(action.items.results.hits.hits, (d, i) => {
                items.push({id: d._id, q: action.items.query, color: action.items.color, fields: d._source});
            });

            const fields = state.fields;
            forEach(items, (d, i) => {
                forEach(fields, (source) => {
                    const sourceValue = fieldLocator(d.fields, source.path);
                    if (!sourceValue) return;

                    let n = find(nodes, {id: normalize(sourceValue)})
                    if (n) {
                        n.connections++; 
                        n.queries.push(d.q); 
                        return;
                    }

                    nodes.push({
                        id: normalize(sourceValue),
                        queries: [d.q],
                        name: sourceValue,
                        colors: [d.color],
                        connections: 1,
                        icon: source.icon
                    });

                    forEach(fields, (target) => {
                        const targetValue = fieldLocator(d.fields, target.path);
                        if (!targetValue) return;

                        if (find(links, {source: normalize(sourceValue), target: normalize(targetValue)})) {
                            // link already exists
                            return;
                        }

                        links.push({
                            source: normalize(sourceValue),
                            target: normalize(targetValue),
                        });
                    });
                });
            });

            return Object.assign({}, state, {
                errors: null,
                nodes: nodes,
                links: links, 
                items: concat(state.items, items),
                searches: searches,
                isFetching: false,
                didInvalidate: false
            });
            break;

        default:
            return state;
            break;
    }
}
