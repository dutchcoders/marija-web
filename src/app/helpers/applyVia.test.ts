import applyVia from "./applyVia";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";

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
            endpoints: ['client', 'server'],
            label: 'port',
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
        endpoints: ['client', 'server'],
        label: 'port',
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
        endpoints: ['client', 'server'],
        label: 'port',
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

test('should add labeled links between nodes that already have labeled links (from real world problem)', () => {
    const inputNodes = JSON.parse('[{"id":"23.129.3492.1","queries":["wodan"],"items":["09a9015e1919eb58de1f086ad51c41ea"],"count":1,"name":"23.129.3492.1","abbreviated":"23.129.3492.1","description":"","icon":"S","fields":["source-ip"],"hash":-1828723008,"normalizationId":null,"display":true,"selected":false,"highlighted":false,"displayTooltip":false,"isNormalizationParent":false},{"id":"127.0.0.1","queries":["wodan"],"items":["09a9015e1919eb58de1f086ad51c41ea"],"count":1,"name":"127.0.0.1","abbreviated":"127.0.0.1","description":"","icon":"D3","fields":["dest-ip"],"hash":1505998205,"normalizationId":null,"display":true,"selected":false,"highlighted":false,"displayTooltip":false,"isNormalizationParent":false},{"id":"1337","queries":["wodan"],"items":["09a9015e1919eb58de1f086ad51c41ea"],"count":1,"name":"1337","abbreviated":"1337","description":"","icon":"P","fields":["port"],"hash":1510406,"normalizationId":null,"display":true,"selected":false,"highlighted":false,"displayTooltip":false,"isNormalizationParent":false}]');
    const inputLinks = JSON.parse('[{"source":"23.129.3492.1","target":"127.0.0.1","label":"2337","viaId":"11","display":true,"normalizationId":null,"isNormalizationParent":false,"total":1,"current":1,"color":"","replacedNode":{"id":"2337","queries":["wodan"],"items":["09a9015e1919eb58de1f086ad51c41ea"],"count":1,"name":"2337","abbreviated":"2337","description":"","icon":"P","fields":["port"],"hash":1540197,"normalizationId":null,"display":true,"selected":false,"highlighted":false,"displayTooltip":false,"isNormalizationParent":false}},{"source":"23.129.3492.1","target":"1337","color":"#ccc","total":1,"current":1,"normalizationId":null,"display":true,"isNormalizationParent":false,"viaId":null,"replacedNode":null},{"source":"127.0.0.1","target":"1337","color":"#ccc","total":1,"current":1,"normalizationId":null,"display":true,"isNormalizationParent":false,"viaId":null,"replacedNode":null}]');
    const via = JSON.parse('[{"endpoints":["source-ip","dest-ip"],"label":"port","id":"11"}]');

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
            endpoints: ['source', 'target'],
            label: 'port',
            id: '1'
        },
        {
            endpoints: ['source2', 'target2'],
            label: 'port',
            id: '2'
        }
    ];

    const { nodes, links } = applyVia(inputNodes, inputLinks, via);

    expect(nodes.length).toBe(4);
    expect(links).toBeDefined();
    expect(links.length).toBe(3);
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
//             label: 'port'
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
//     expect(links[0].label).toBe('80');
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
//             label: 'port'
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