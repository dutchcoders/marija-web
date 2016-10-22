import { concat, without, reduce, remove, find, forEach } from 'lodash';

import {  DELETE_NODES, HIGHLIGHT_NODES, SELECT_NODE, SELECT_NODES, CLEAR_SELECTION } from '../modules/graph/index'
import {  DELETE_SEARCH, RECEIVE_ITEMS, REQUEST_ITEMS } from '../modules/search/index'
import {  ERROR, AUTH_CONNECTED, Socket } from '../utils/index'
import {  TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, ADD_INDEX, DELETE_INDEX, ADD_FIELD, DELETE_FIELD } from '../modules/data/index'

import { phone, fieldLocator } from '../helpers/index'

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
}

export default function entries(state = defaultState, action) {
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
            remove(items, (p) => {
                return (reduce(state.fields, (found, field) => {
                    found = found || find(action.nodes, (o) => {
                            return phone(fieldLocator(p.fields, field)) == o;
                        });
                    return found;
                }, false));
            });

            return Object.assign({}, state, {
                items: items
            })
        case DELETE_SEARCH:
            var searches = without(state.searches, action.search);

            var items = concat(state.items);
            remove(items, (p) => {
                return (p.q === action.search.q)
            });

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
                isFetching: true,
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

            var nodes = concat(state.nodes, []);
            var items = concat(state.items, []);
            forEach(action.items.results.hits.hits, (d, i) => {
                items.push({id: d._id, q: action.items.query, color: action.items.color, fields: d._source});
                nodes.push({id: d._id, q: action.items.query, color: action.items.color, fields: d._source, record: d});
            });

            return Object.assign({}, state, {
                errors: null,
                nodes: nodes,
                items: items,
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
