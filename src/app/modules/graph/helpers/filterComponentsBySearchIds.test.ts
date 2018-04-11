import filterComponentsByQueries from "./filterComponentsBySearchIds";

test('should filter out components that dont contain nodes from the primary query', () => {
    const components = [
        [
            {
                id: 'a',
                searchIds: ['first search']
            },
            {
                id: 'b',
                searchIds: ['second search']
            }
        ],
        [
            {
                id: 'c',
                searchIds: ['second search']
            },
            {
                id: 'd',
                searchIds: ['second search']
            }
        ]
    ] as any;

    const filtered = filterComponentsByQueries(components, ['first search']);

    expect(filtered.length).toBe(1);
    expect(filtered[0].length).toBe(2);
    expect(filtered[0].find(node => node.searchIds.indexOf('first search') !== -1)).toBeDefined();
});

test('should work when specifying multiple searchIds', () => {
    const components = [
        [
            {
                id: 'a',
                searchIds: ['first search']
            },
            {
                id: 'b',
                searchIds: ['second search']
            }
        ],
        [
            {
                id: 'c',
                searchIds: ['second search']
            },
            {
                id: 'd',
                searchIds: ['myLive']
            }
        ]
    ] as any;

    const filtered = filterComponentsByQueries(components, ['first search', 'myLive']);

    expect(filtered.length).toBe(2);
    expect(filtered[0].length).toBe(2);
    expect(filtered[1].length).toBe(2);
});