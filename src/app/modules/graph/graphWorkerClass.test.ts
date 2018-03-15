import GraphWorkerClass, {
    GraphWorkerOutput,
    GraphWorkerPayload
} from './graphWorkerClass';
import {SEARCH_RECEIVE} from '../search/constants';
import {Item} from "../../interfaces/item";
import {Node} from "../../interfaces/node";
import {uniqueId} from 'lodash';
import {Field} from "../../interfaces/field";
import {Search} from "../../interfaces/search";
import {Link} from "../../interfaces/link";


const getItem = (data, query = 'query', id = uniqueId()) => {
    return {
        id: id,
        query: query,
        fields: data,
        nodes: [],
    } as Item;
};

const getField = (name) => {
    return {
        path: name
    } as Field;
};

const getSearch = (query) => {
    return {
        displayNodes: 500,
        aroundNodeId: null,
        q: query,
        liveDatasource: null,
        datasources: [],
        items: []
    } as Search;
};

const getNode = (id, query, itemIds) => {
    return {
        id: id,
        name: id,
        queries: [query],
        items: itemIds,
        count: 0,
        fields: [],
        display: true
    } as Node;
};

const getLink = (source, target) => {
    return {
        source: source,
        target: target
    } as Link;
};

const defaultPayload: GraphWorkerPayload = {
    items: [],
    query: 'query',
    prevNodes: [],
    prevLinks: [],
    prevItems: [],
    fields: [
        getField('client'),
        getField('server')
    ],
    normalizations: [],
    searches: [
        getSearch('query')
    ],
    deletedNodes: [],
    via: [],
    receivedAt: 0,
};

const getEvent = (payload: GraphWorkerPayload) => {
    return {
        data: {
            payload: payload,
            type: SEARCH_RECEIVE
        }
    } as MessageEvent;
};

test('should output nodes', (done) => {
    const graphWorker = new GraphWorkerClass();

    graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
        expect(output.nodes.length).toBe(3);

        done();
    });

    const payload: GraphWorkerPayload = {
        ...defaultPayload,
        items: [
            getItem({client: 1, server: 2}),
            getItem({client: 3, server: 2}),
        ]
    };

    graphWorker.onMessage(getEvent(payload));
});

test('should correctly output nodes when there are multiple queries', (done) => {
    const graphWorker = new GraphWorkerClass();

    graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
        const node1 = output.nodes.find(node => node.id === '1');
        const node2 = output.nodes.find(node => node.id === '2');
        const node3 = output.nodes.find(node => node.id === '3');
        const node4 = output.nodes.find(node => node.id === '4');

        expect(node1.queries).toEqual(['query1']);
        expect(node2.queries).toEqual(['query1', 'query2']);
        expect(node3.queries).toEqual(['query1']);
        expect(node4.queries).toEqual(['query2']);

        done();
    });

    const payload: GraphWorkerPayload = {
        ...defaultPayload,
        searches: [
            getSearch('query1'),
            getSearch('query2')
        ],
        prevNodes: [
            getNode('1', 'query1', ['a']),
            getNode('2', 'query1', ['a', 'b']),
            getNode('3', 'query1', ['b']),
        ],
        prevLinks: [
            getLink('1', '2'),
            getLink('3', '2')
        ],
        prevItems: [
            getItem({client: 1, server: 2}, 'query1', 'a'),
            getItem({client: 3, server: 2}, 'query1', 'b'),
        ],
        items: [
            getItem({client: 4, server: 2}, 'query2', 'c'),
        ],
        query: 'query2'
    };

    graphWorker.onMessage(getEvent(payload));
});
