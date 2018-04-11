import { uniqueId } from 'lodash';

import removeNodesAndLinks from './removeNodesAndLinks';

const generateNode = (name, searchIds) => {
    return {
        id: uniqueId(),
        searchIds: searchIds,
        name: 'test' + uniqueId(),
        description: 'vfnjdsvnfds',
        icon: 'a',
        fields: [
            'text'
        ]
    };
};

const generateLink = (source, target) => {
    return {
        color: '#ccc',
        source: source,
        target: target,
        searchIds: []
    };
};

test('should remove nodes', () => {
    const previousNodes = [
        generateNode('test1', ['test query 1']),
        generateNode('test2', ['test query 2'])
    ];

    const {nodes, links} = removeNodesAndLinks(previousNodes as any, [], 'test query 1');

    expect(nodes.length).toBe(1);
});

test('should remove links to nodes that no longer exist', () => {
    const previousNodes = [
        generateNode('test1', ['test query 1']),
        generateNode('test2', ['test query 2'])
    ];

    const previousLinks = [
        generateLink('test1', 'test2')
    ];

    const {nodes, links} = removeNodesAndLinks(previousNodes as any, previousLinks as any, 'test query 1');

    expect(links.length).toBe(0);
});