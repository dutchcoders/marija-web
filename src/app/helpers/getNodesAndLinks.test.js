import getNodesAndLinks from './getNodesAndLinks';
import { uniqueId } from 'lodash';

const generateItem = (fields) => {
    if (typeof fields === 'undefined') {
        fields = {
            text: 'test' + uniqueId()
        };
    }

    return {
        highlight: null,
        id: uniqueId(),
        fields: fields,
        query: undefined
    };
};

const generateField = (field) => {
    return {
        icon: 'a',
        path: field
    };
};

const generateQuery = (items) => {
    return {
        color: '#aaaaaa',
        q: 'my search',
        total: 100,
        items: items
    };
};

test('should output nodes', () => {
    const previousNodes = [];
    const previousLinks = [];
    const normalizations = [];

    const items = [
        generateItem(),
        generateItem(),
        generateItem()
    ];

    const fields = [
        generateField('text')
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, normalizations);

    expect(nodes.length).toBe(3);
});

test('should output 1 node for every field in an item', () => {
    const previousNodes = [];
    const previousLinks = [];
    const normalizations = [];

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
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, normalizations);

    expect(nodes.length).toBe(2);
});

test('should output nodes for nested data', () => {
    const previousNodes = [];
    const previousLinks = [];
    const normalizations = [];

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
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, normalizations);

    expect(nodes.length).toBe(2);
});

test('should output links between related nodes', () => {
    const previousNodes = [];
    const previousLinks = [];
    const normalizations = [];

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
    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, normalizations);

    expect(links).toBeDefined();
    expect(links.length).toBe(1);
});


test('when nodes have exactly the same fields they should not be duplicated', () => {
    const previousNodes = [];
    const previousLinks = [];
    const normalizations = [];

    const items = [
        generateItem({text: 'same'}),
        generateItem({text: 'same'})
    ];

    const fields = [
        generateField('text'),
    ];

    const query = generateQuery(items);
    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, normalizations);

    expect(nodes.length).toBe(1);
});

test('should filter nodes that are not directly related when searching around a node', () => {
    const previousNodes = [{
        id: 1,
    }, {
        id: 2
    }];
    const previousLinks = [{
        source: 1,
        target: 2
    }];

    const items = [
        {
            id: 3,
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

    const aroundNodeId = 2;

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, [], aroundNodeId);

    // Nothing should be added, because the new items were not directly related to node id 2
    expect(nodes.length).toBe(2);
    expect(links.length).toBe(1);
});


test('should not filter nodes that are directly related when searching around a node', () => {
    const previousNodes = [{
        id: 1,
        items: [],
        fields: [],
        queries: []
    }, {
        id: 2,
        items: [],
        fields: [],
        queries: []
    }];
    const previousLinks = [{
        source: 1,
        target: 2
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

    const aroundNodeId = '1';

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, [], aroundNodeId);

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

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, []);

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

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, []);

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

    let result = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, []);
    result = getNodesAndLinks(result.nodes, result.links, items, fields, query, []);

    expect(result.nodes.length).toBe(2);
    expect(result.links.length).toBe(1);
    expect(result.links[0].itemIds.length).toBe(2);
});