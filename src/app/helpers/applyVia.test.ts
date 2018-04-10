import applyVia from "./applyVia";
import {Node} from "../modules/graph/interfaces/node";
import {Link} from "../modules/graph/interfaces/link";

const generateNode = (id: string, fields: string[]): Node => {
    return {
        id: id,
        name: id,
        fields: fields
    } as Node
};

const generateLink = (source: string, target: string): Link => {
    return {
        source: source,
        target: target
    } as Link;
};

// test if a link exists between a source and a target
const expectLink = (links: Link[], source: string, target: string) => {
    const link = links.find(link =>
        (link.source === source && link.target === target)
        || (link.target === source && link.source === target)
    );
    expect(link).toBeDefined();
};

test('should output links with labels when via info is specified', () => {
    const via = [
        {
            from: 'client',
            to: 'server',
            via: 'port',
            id: '1'
        }
    ];

    const nodes = [
        generateNode('80', ['port']),
        generateNode('1', ['client']),
        generateNode('2', ['server']),
    ];

    const links = [
        generateLink('80', '1'),
        generateLink('80', '2'),
        generateLink('1', '2'),
    ];

    const result = applyVia(nodes, links, via);

    expect(result.nodes.length).toBe(2);
    expect(result.links).toBeDefined();
    expect(result.links.length).toBe(1);
    expectLink(result.links, '1', '2');

    result.links.forEach(link => {
        expect(link.label).toBe('80');
    });
});

test('should be able to draw multiple labeled lines between 2 nodes', () => {
    const via = [{
        from: 'client',
        to: 'server',
        via: 'port',
        id: '1'
    }];

    const inputNodes = [
        generateNode('80', ['port']),
        generateNode('1', ['client']),
        generateNode('2', ['server']),
        generateNode('1337', ['port'])
    ];

    const inputLinks = [
        generateLink('80', '1'),
        generateLink('80', '2'),
        generateLink('1337', '1'),
        generateLink('1337', '2')
    ];

    const { nodes, links } = applyVia(inputNodes, inputLinks, via);

    expect(nodes.length).toBe(2);
    expect(links).toBeDefined();
    expect(links.length).toBe(2);
    expect(links.find(link => link.label === '80')).toBeDefined();
    expect(links.find(link => link.label === '1337')).toBeDefined();
});

test('should be able to draw multiple labeled lines between 2 nodes, when the second set arrives later', () => {
    const via = [{
        from: 'client',
        to: 'server',
        via: 'port',
        id: '1'
    }];

    const inputNodes = [
        generateNode('80', ['port']),
        generateNode('1', ['client']),
        generateNode('2', ['server'])
    ];

    const inputLinks = [
        generateLink('80', '1'),
        generateLink('80', '2'),
        generateLink('1', '2'),
    ];

    const result1 = applyVia(inputNodes, inputLinks, via);

    // Now we've applied via config to the first nodes
    expect(result1.nodes.length).toBe(2);
    expect(result1.links.length).toBe(1);

    // Add the second set of nodes
    inputNodes.push(generateNode('1337', ['port']));
    inputLinks.push(generateLink('1337', '1'));
    inputLinks.push(generateLink('1337', '2'));

    const result2 = applyVia(inputNodes, inputLinks, via);

    expect(result2.nodes.length).toBe(2);
    expect(result2.links.length).toBe(2);
});

test('should not mess up when multiple via configs are present', () => {
    const inputNodes = [
        generateNode('80', ['port']),
        generateNode('1', ['source']),
        generateNode('2', ['target']),
        generateNode('10', ['source2']),
        generateNode('20', ['target2']),
        generateNode('1337', ['port'])
    ];

    const inputLinks = [
        generateLink('80', '1'),
        generateLink('80', '2'),
        generateLink('80', '10'),
        generateLink('80', '20'),
        generateLink('1337', '1'),
        generateLink('1337', '2'),
    ];

    const via = [
        {
            from: 'source',
            to: 'target',
            via: 'port',
            id: '1'
        },
        {
            from: 'source2',
            to: 'target2',
            via: 'port',
            id: '2'
        }
    ];

    const { nodes, links } = applyVia(inputNodes, inputLinks, via);

    expect(nodes.length).toBe(4);
    expect(links).toBeDefined();
    expect(links.length).toBe(3);
});


test('should not add multiple links with the same label between the same 2 nodes (1 link per label)', () => {
    const via = [{
        from: 'client',
        to: 'server',
        via: 'port',
        id: '1'
    }];

    const inputNodes = [
        generateNode('80', ['port']),
        generateNode('1', ['client']),
        generateNode('2', ['server'])
    ];

    const inputLinks = [
        generateLink('80', '1'),
        generateLink('80', '2'),
        generateLink('1', '2'),
    ];

    const result1 = applyVia(inputNodes, inputLinks, via);

    // Now we've applied via config to the first nodes
    expect(result1.nodes.length).toBe(2);
    expect(result1.links.length).toBe(1);

    // Add the second set of nodes
    result1.nodes.push(generateNode('80', ['port']));
    result1.links.push(generateLink('80', '1'));
    result1.links.push(generateLink('80', '2'));

    const result2 = applyVia(result1.nodes, result1.links, via);

    expect(result2.nodes.length).toBe(2);
    expect(result2.links.length).toBe(1);
});
//
// test('should generate labeled links between endpoints of the same type', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//     const normalizations = [];
//
//     const items = [
//         generateItem({
//             'ip': 1,
//             'port': 80,
//         }),
//         generateItem({
//             'ip': 2,
//             'port': 80
//         })
//     ];
//
//     const fields = [
//         generateField('ip'),
//         generateField('port')
//     ];
//
//     const query = generateQuery(items);
//
//     const via = [
//         {
//             endpoints: ['ip', 'ip'],
//             via: 'port'
//         }
//     ];
//
//     let { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, [], []);
//     const viaResult = applyVia(nodes, links, via);
//     nodes = viaResult.nodes;
//     links = viaResult.links;
//
//     expect(nodes.length).toBe(2);
//     expect(links).toBeDefined();
//     expect(links.length).toBe(1);
//     expect(links[0].via).toBe('80');
// });
//
// test('should not remove too many links when via info is specified', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         generateItem({
//             'port': 80,
//             'client': 1,
//             'server': 2,
//             'country': 'nl'
//         })
//     ];
//
//     const fields = [
//         generateField('client'),
//         generateField('server'),
//         generateField('port'),
//         generateField('country'),
//     ];
//
//     const query = generateQuery(items);
//
//     const via = [
//         {
//             endpoints: ['client', 'server'],
//             via: 'port'
//         }
//     ];
//
//     const result = getNodesAndLinks(previousNodes, previousLinks, items, fields, query, [], []);
//
//     const { nodes, links } = applyVia(result.nodes, result.links, via);
//
//     expect(nodes.length).toBe(3);
//
//     expect(links).toBeDefined();
//     expect(links.length).toBe(3);
//
//     expectLink(links, 1, 2);
//     expectLink(links, 'nl', 1);
//     expectLink(links, 'nl', 2);
// });