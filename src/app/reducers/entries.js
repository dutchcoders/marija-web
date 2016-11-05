import { concat, without, reduce, remove, find, forEach } from 'lodash';

import {  NODES_DELETE, NODES_HIGHLIGHT, NODE_SELECT, NODES_SELECT, SELECTION_CLEAR } from '../modules/graph/index';
import {  SEARCH_DELETE, ITEMS_RECEIVE, ITEMS_REQUEST } from '../modules/search/index';
import {  ERROR, AUTH_CONNECTED, Socket } from '../utils/index';
import {  TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, INDEX_ADD, INDEX_DELETE, FIELD_ADD, FIELD_DELETE } from '../modules/data/index';

import { normalize, fieldLocator } from '../helpers/index';

export const defaultState = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    connected: false,
    total: 0,
    node: [],
    highlight_nodes: [],
    columns: [],
    fields: [],
    indexes: [],
    items: [],
    searches: [],
    nodes: [], // all nodes
    links: [], // relations between nodes
    errors: null
};

export default function entries(state = defaultState, action) {
    switch (action.type) {
        case SELECTION_CLEAR:
            return Object.assign({}, state, {
                node: [],
            });
        case INDEX_ADD:
            var indexes = concat(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            });
        case INDEX_DELETE:
            var indexes = without(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            });
        case NODES_DELETE:
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
            });
        case SEARCH_DELETE:
            var searches = without(state.searches, action.search);

            var items = concat(state.items);
            remove(items, (p) => {
                return (p.q === action.search.q);
            });

            // todo(nl5887): remove related nodes and links

            return Object.assign({}, state, {
                searches: searches,
                items: items
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
            return Object.assign({}, state, {
                fields: concat(state.fields, action.field)
            });
        case FIELD_DELETE:
            return Object.assign({}, state, {
                fields: without(state.fields, action.field)
            });
        case NODES_HIGHLIGHT:
            return Object.assign({}, state, {
                highlight_nodes: action.nodes
            });
        case NODES_SELECT:
            return Object.assign({}, state, {
                node: concat(action.nodes)
            });
        case NODE_SELECT:
            return Object.assign({}, state, {
                node: concat(state.node, action.node)
            });
        case ERROR:
            return Object.assign({}, state, {
                errors: action.errors
            });
        case AUTH_CONNECTED:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                ...action
            });
        case ITEMS_REQUEST:
            Socket.ws.postMessage({query: action.query, index: action.index, color: action.color});
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });
        case ITEMS_RECEIVE:
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
                    if (!sourceValue) {return;}

                    let n = find(nodes, {id: normalize(sourceValue)});
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
                        if (!targetValue) {return;}

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
        default:
            return state;
    }
}
