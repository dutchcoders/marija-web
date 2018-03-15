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

const getSearch = (query, liveDatasource = null, aroundNodeId = null) => {
    return {
        displayNodes: 500,
        aroundNodeId: aroundNodeId,
        q: query,
        liveDatasource: liveDatasource,
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

test('should output nodes and links', (done) => {
    const graphWorker = new GraphWorkerClass();

    graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
        expect(output.nodes.length).toBe(3);
        expect(output.links.length).toBe(2);

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

        expect(output.nodes.length).toBe(4);
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

test('should not filter secondary components if there is 1 live datasource, and 1 normal search', (done) => {
    const graphWorker = new GraphWorkerClass();

    graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {


        expect(output.nodes.length).toBe(6);

        done();
    });

    const payload: GraphWorkerPayload = {
        ...defaultPayload,
        searches: [
            getSearch('live', 'live'),
            getSearch('query2')
        ],
        prevNodes: [
            getNode('1', 'live', ['a']),
            getNode('2', 'live', ['a', 'b']),
            getNode('3', 'live', ['b']),
        ],
        prevLinks: [
            getLink('1', '2'),
            getLink('3', '2')
        ],
        prevItems: [
            getItem({client: 1, server: 2}, 'live', 'a'),
            getItem({client: 3, server: 2}, 'live', 'b'),
        ],
        items: [
            getItem({client: 4, server: 5}, 'query2', 'c'),
            getItem({client: 6, server: 5}, 'query2', 'd'),
        ],
        query: 'query2'
    };

    graphWorker.onMessage(getEvent(payload));
});


test('should work with "search around" queries', (done) => {
    const graphWorker = new GraphWorkerClass();

    graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
        expect(output.nodes.length).toBe(6);

        done();
    });

    const payload: GraphWorkerPayload = {
        ...defaultPayload,
        searches: [
            getSearch('query1'),
            getSearch('node1', null, 'node1')
        ],
        prevNodes: [
            getNode('node1', 'query1', ['a']),
            getNode('2', 'query1', ['a', 'b']),
            getNode('3', 'query1', ['b']),
        ],
        prevLinks: [
            getLink('node1', '2'),
            getLink('3', '2')
        ],
        prevItems: [
            getItem({client: 'node1', server: 2}, 'live', 'a'),
            getItem({client: 3, server: 2}, 'live', 'b'),
        ],
        items: [
            // These items should all appear as nodes, because they're directly
            // related to the 'searchAroundId'
            getItem({client: 'node1', server: 4}, 'node1', 'c'),
            getItem({client: 'node1', server: 5}, 'node1', 'd'),
            getItem({client: 'node1', server: 6}, 'node1', 'e'),
            // This item should not appear in the output:
            getItem({client: 'unrelated', server: 7}, 'node1', 'f'),
        ],
        query: 'node1'
    };

    graphWorker.onMessage(getEvent(payload));
});
