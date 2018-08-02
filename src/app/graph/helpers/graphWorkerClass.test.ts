test('' , () => {});
// import GraphWorkerClass, {
//     GraphWorkerOutput,
//     GraphWorkerPayload
// } from './graphWorkerClass';
// import {SEARCH_RECEIVE} from '../../search/searchConstants';
// import {Item} from "../interfaces/item";
// import {Node} from "../interfaces/node";
// import {uniqueId} from 'lodash';
// import {Field} from "../../fields/interfaces/field";
// import {Search} from "../../search/interfaces/search";
// import {Link} from "../interfaces/link";
// import { getNumericHash } from './getNumericHash';
// import { DEFAULT_DISPLAY_ITEMS_PER_SEARCH } from '../graphConstants';
//
//
// const getItem = (data, query = 'query', id = uniqueId()) => {
//     return {
//         id: id,
//         searchId: query,
//         fields: data,
//         nodes: [],
//     } as Item;
// };
//
// const getField = (name) => {
//     return {
//         path: name
//     } as Field;
// };
//
// const getSearch = (query, liveDatasource = null, aroundNodeId = null) => {
//     return {
//         displayNodes: DEFAULT_DISPLAY_ITEMS_PER_SEARCH,
//         aroundNodeId: aroundNodeId,
//         q: query,
//         liveDatasource: liveDatasource,
//         datasources: [],
//         items: [],
//         searchId: query
//     } as Search;
// };
//
// const getNode = (id, query, itemIds) => {
//     return {
//         id: getNumericHash(id),
//         name: id,
//         searchIds: [query],
//         items: itemIds,
//         count: 0,
//         fields: [],
//         display: true,
//         itemIds: []
//     } as any;
// };
//
// const getLink = (source, target) => {
//     return {
//         hash: getNumericHash(source) + getNumericHash(target),
//         source: getNumericHash(source),
//         target: getNumericHash(target),
//         normalizationIds: [],
//         itemIds: []
//     } as Link;
// };
//
// const defaultPayload: GraphWorkerPayload = {
//     items: [],
//     searchId: 'query',
//     prevNodes: [],
//     prevLinks: [],
//     prevItems: [],
//     normalizations: [],
//     searches: [
//         getSearch('query')
//     ],
//     deletedNodeIds: [],
//     via: [],
//     receivedAt: 0,
//     sortColumn: null,
//     sortType: 'asc',
//     filterBoringNodes: true,
//     filterSecondaryQueries: true,
//     connectors: [],
//     datasources: [],
//     outputId: '1'
// };
//
// const getAction = (payload: GraphWorkerPayload) => {
//     return {
//         payload: payload,
//         type: SEARCH_RECEIVE
//     };
// };
//
// test('should output nodes and links', (done) => {
//     const graphWorker = new GraphWorkerClass();
//
//     graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
//         expect(output.nodes.length).toBe(3);
//         expect(output.links.length).toBe(2);
//
//         done();
//     });
//
//     const payload: GraphWorkerPayload = {
//         ...defaultPayload,
//         items: [
//             getItem({client: 1, server: 2}),
//             getItem({client: 3, server: 2}),
//         ]
//     };
//
//     graphWorker.onMessage(getAction(payload));
// });
//
// test('should correctly output nodes when there are multiple searchIds', (done) => {
//     const graphWorker = new GraphWorkerClass();
//
//     graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
//         const node1 = output.nodes.find(node => node.id === getNumericHash(1));
//         const node2 = output.nodes.find(node => node.id === getNumericHash(2));
//         const node3 = output.nodes.find(node => node.id === getNumericHash(3));
//         const node4 = output.nodes.find(node => node.id === getNumericHash(4));
//
//         expect(output.nodes.length).toBe(4);
//         expect(node1.searchIds).toEqual(['query1']);
//         expect(node2.searchIds).toEqual(['query1', 'query2']);
//         expect(node3.searchIds).toEqual(['query1']);
//         expect(node4.searchIds).toEqual(['query2']);
//
//         done();
//     });
//
//     const payload: GraphWorkerPayload = {
//         ...defaultPayload,
//         searches: [
//             getSearch('query1'),
//             getSearch('query2')
//         ],
//         prevNodes: [
//             getNode(1, 'query1', ['a']),
//             getNode(2, 'query1', ['a', 'b']),
//             getNode(3, 'query1', ['b']),
//         ],
//         prevLinks: [
//             getLink(1, 2),
//             getLink(3, 2)
//         ],
//         prevItems: [
//             getItem({client: 1, server: 2}, 'query1', 'a'),
//             getItem({client: 3, server: 2}, 'query1', 'b'),
//         ],
//         items: [
//             getItem({client: 4, server: 2}, 'query2', 'c'),
//         ],
//         searchId: 'query2'
//     };
//
//     graphWorker.onMessage(getAction(payload));
// });
//
// test('should not filter secondary components if there is 1 live datasource, and 1 normal search', (done) => {
//     const graphWorker = new GraphWorkerClass();
//
//     graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
//
//
//         expect(output.nodes.length).toBe(6);
//
//         done();
//     });
//
//     const payload: GraphWorkerPayload = {
//         ...defaultPayload,
//         searches: [
//             getSearch('live', 'live'),
//             getSearch('query2')
//         ],
//         prevNodes: [
//             getNode('1', 'live', ['a']),
//             getNode('2', 'live', ['a', 'b']),
//             getNode('3', 'live', ['b']),
//         ],
//         prevLinks: [
//             getLink('1', '2'),
//             getLink('3', '2')
//         ],
//         prevItems: [
//             getItem({client: 1, server: 2}, 'live', 'a'),
//             getItem({client: 3, server: 2}, 'live', 'b'),
//         ],
//         items: [
//             getItem({client: 4, server: 5}, 'query2', 'c'),
//             getItem({client: 6, server: 5}, 'query2', 'd'),
//         ],
//         searchId: 'query2'
//     };
//
//     graphWorker.onMessage(getAction(payload));
// });
//
//
// test('should work with "search around" searchIds', (done) => {
//     const graphWorker = new GraphWorkerClass();
//
//     graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
//         expect(output.nodes.length).toBe(6);
//
//         done();
//     });
//
//     const payload: GraphWorkerPayload = {
//         ...defaultPayload,
//         searches: [
//             getSearch('query1'),
//             getSearch('node1', null, 'node1')
//         ],
//         prevNodes: [
//             getNode('node1', 'query1', ['a']),
//             getNode('2', 'query1', ['a', 'b']),
//             getNode('3', 'query1', ['b']),
//         ],
//         prevLinks: [
//             getLink('node1', '2'),
//             getLink('3', '2')
//         ],
//         prevItems: [
//             getItem({client: 'node1', server: 2}, 'live', 'a'),
//             getItem({client: 3, server: 2}, 'live', 'b'),
//         ],
//         items: [
//             // These items should all appear as nodes, because they're directly
//             // related to the 'searchAroundId'
//             getItem({client: 'node1', server: 4}, 'node1', 'c'),
//             getItem({client: 'node1', server: 5}, 'node1', 'd'),
//             getItem({client: 'node1', server: 6}, 'node1', 'e'),
//             // This item should not appear in the output:
//             getItem({client: 'unrelated', server: 7}, 'node1', 'f'),
//         ],
//         searchId: 'node1'
//     };
//
//     graphWorker.onMessage(getAction(payload));
// });
//
// test('should sort items', (done) => {
//     const graphWorker = new GraphWorkerClass();
//
//     graphWorker.output.addListener('output', (output: GraphWorkerOutput) => {
//         const firstIndex: number = output.items.findIndex(item =>
//             item.fields.client === 'A'
//         );
//
//         const secondIndex: number = output.items.findIndex(item =>
//             item.fields.client === 'B'
//         );
//
//         expect(firstIndex).toBe(0);
//         expect(secondIndex).toBe(1);
//
//         done();
//     });
//
//     const payload: GraphWorkerPayload = {
//         ...defaultPayload,
//         searches: [
//             getSearch('query1')
//         ],
//         prevNodes: [],
//         prevLinks: [],
//         prevItems: [],
//         items: [
//             getItem({client: 'B', server: 4}, 'query1'),
//             getItem({client: 'A', server: 5}, 'query1'),
//         ],
//         searchId: 'query1',
//         sortColumn: 'client'
//     };
//
//     graphWorker.onMessage(getAction(payload));
// });
