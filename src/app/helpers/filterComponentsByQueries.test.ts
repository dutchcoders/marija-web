import filterComponentsByQueries from "./filterComponentsByQueries";

test('should filter out components that dont contain nodes from the primary query', () => {
    const components = [
        [
            {
                id: 'a',
                queries: ['first search']
            },
            {
                id: 'b',
                queries: ['second search']
            }
        ],
        [
            {
                id: 'c',
                queries: ['second search']
            },
            {
                id: 'd',
                queries: ['second search']
            }
        ]
    ] as any;

    const filtered = filterComponentsByQueries(components, ['first search']);

    expect(filtered.length).toBe(1);
    expect(filtered[0].length).toBe(2);
    expect(filtered[0].find(node => node.queries.indexOf('first search') !== -1)).toBeDefined();
});

test('should work when specifying multiple queries', () => {
    const components = [
        [
            {
                id: 'a',
                queries: ['first search']
            },
            {
                id: 'b',
                queries: ['second search']
            }
        ],
        [
            {
                id: 'c',
                queries: ['second search']
            },
            {
                id: 'd',
                queries: ['myLive']
            }
        ]
    ] as any;

    const filtered = filterComponentsByQueries(components, ['first search', 'myLive']);

    expect(filtered.length).toBe(2);
    expect(filtered[0].length).toBe(2);
    expect(filtered[1].length).toBe(2);
});