import { uniqueId } from 'lodash';

import getNodesAndLinks, { getHash } from './getNodesAndLinks';
import {Item} from "../../items/interfaces/item";
import {Field} from "../../fields/interfaces/field";
import {Search} from "../../search/interfaces/search";

const generateItem = (fields: any = undefined) => {
    if (typeof fields === 'undefined') {
        fields = {
            text: 'test' + uniqueId()
        };
    }

    return {
        highlight: null,
        id: uniqueId(),
        fields: fields,
        query: undefined,
        searchId: null,
        count: 0,
        requestedExtraData: false,
        nodes: [],
        receivedExtraData: false
    } as Item;
};

const generateField = (field) => {
    return {
        icon: 'a',
        path: field
    } as Field;
};

const generateQuery = (items) => {
    return {
        color: '#aaaaaa',
        q: 'my search',
        searchId: 'my search',
        total: 100,
        items: items
    } as Search;
};

test('should output nodes', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        generateItem(),
        generateItem(),
        generateItem()
    ];

    const fields = [
        generateField('text')
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query);

    expect(nodes.length).toBe(3);
});

test('should output 1 node for every field in an item', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        generateItem({
            text: 'hello',
            user: 'thomas'
        }),
    ];

    const fields = [
        generateField('text'),
        generateField('user')
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query);

    expect(nodes.length).toBe(2);
});

test('should output nodes for nested data', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        generateItem({
            text: 'hello',
            user: {
                name: 'thomas'
            }
        }),
    ];

    const fields = [
        generateField('text'),
        generateField('user')
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query);

    expect(nodes.length).toBe(2);
});

test('should output links between related nodes', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        generateItem({
            text: 'lalala',
            user: 'thomas'
        }),
    ];

    const fields = [
        generateField('text'),
        generateField('user')
    ];

    const query = generateQuery(items);
    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query);

    expect(links).toBeDefined();
    expect(links.length).toBe(1);
});


test('when nodes have exactly the same fields they should not be duplicated', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        generateItem({text: 'same'}),
        generateItem({text: 'same'})
    ];

    const fields = [
        generateField('text'),
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query);

    expect(nodes.length).toBe(1);
});

test('should not filter nodes that are directly related when searching around a node', () => {
    const previousNodes = [{
        id: getHash(1),
        items: [],
        fields: [],
        searchIds: []
    }, {
        id: getHash(2),
        items: [],
        fields: [],
        searchIds: []
    }];
    const previousLinks = [{
        source: getHash(1),
        target: getHash(2),
        hash: getHash(1) + getHash(2)
    }];

    const items = [
        {
            id: 'vndfnvdfj',
            fields: {
                client: 1,
                server: 3
            }
        }
    ];

    const fields = [
        generateField('client'),
        generateField('server')
    ];

    const query = generateQuery(items);

    const aroundNodeId = getHash(1);

    const {nodes, links } = getNodesAndLinks(previousNodes as any, previousLinks as any, items as any, fields, query, aroundNodeId);

    // 1 node should be added, because the new items were directly related to node id 1
    expect(nodes.length).toBe(3);
    expect(links.length).toBe(2);
});

test('should not not create nodes for empty field values', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        {
            id: 'vndfnvdfj',
            fields: {
                client: 1,
                server: 3
            }
        }
    ];

    const fields = [
        generateField('client'),
        generateField('server'),
        generateField('nonExisting')
    ];

    const query = generateQuery(items);

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, query);

    expect(nodes.length).toBe(2);
    expect(links.length).toBe(1);
});

test('should keep track of item ids, especially when there are multiple lines between 2 nodes', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        {
            id: '1',
            fields: {
                client: 1,
                server: 2
            }
        },
        {
            id: '2',
            fields: {
                client: 1,
                server: 2
            }
        }
    ];

    const fields = [
        generateField('client'),
        generateField('server')
    ];

    const query = generateQuery(items);

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, query);

    expect(nodes.length).toBe(2);
    expect(links.length).toBe(1);
    expect(links[0].itemIds.length).toBe(2);
});

test('should not add the same item id multiple times when function is run twice', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        {
            id: '1',
            fields: {
                client: 1,
                server: 2
            }
        },
        {
            id: '2',
            fields: {
                client: 1,
                server: 2
            }
        }
    ];

    const fields = [
        generateField('client'),
        generateField('server')
    ];

    const query = generateQuery(items);

    let result = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, query);
    result = getNodesAndLinks(result.nodes, result.links, items as any, fields, query);

    expect(result.nodes.length).toBe(2);
    expect(result.links.length).toBe(1);
    expect(result.links[0].itemIds.length).toBe(2);
});

test('should build links between array values', () => {
    const previousNodes = [];
    const previousLinks = [];

    const items = [
        {
            id: '1',
            fields: {
                client: [1, 2, 3],
                server: 4
            }
        }
    ];

    const fields = [
        generateField('client'),
        generateField('server')
    ];

    const query = generateQuery(items);

    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, query);

    expect(nodes.length).toBe(4);
    expect(links.length).toBe(3);
});