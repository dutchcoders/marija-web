import { uniqueId } from 'lodash';

import {
	getHash,
	default as getNodesAndLinks
} from './getNodesAndLinks';
import {Item} from "../../items/interfaces/item";
import {Field} from "../../fields/interfaces/field";

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

const generateField = (field, childOf = '') => {
    return {
        icon: 'a',
        path: field,
        childOf
    } as Field;
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

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

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

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

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

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

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

    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

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

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

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

    const aroundNodeId = getHash(1);

    const {nodes, links } = getNodesAndLinks(previousNodes as any, previousLinks as any, items as any, fields, aroundNodeId);

    // 1 node should be added, because the new items were directly related to node id 1
    expect(nodes.length).toBe(3);
    expect(links.length).toBe(2);
});

test('should not create nodes for empty field values', () => {
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

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

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

    const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

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

    let result = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
    result = getNodesAndLinks(result.nodes, result.links, items as any, fields);

    expect(result.nodes.length).toBe(2);
    expect(result.links.length).toBe(1);
    expect(result.links[0].itemIds.length).toBe(2);
});

test('should create nodes for array values', () => {
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


    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

    expect(nodes.length).toBe(4);
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

    const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

    expect(links.length).toBe(3);
});

test('parents 1', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
                organisation: 'DutchSec'
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Remco',
				last_name: 'Verhoef',
				organisation: 'DutchSec'
			}
		}
	];

	const fields = [
		generateField('last_name'),
		generateField('first_name', 'last_name'),
		generateField('organisation'),
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('parents 2', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
                organisation: 'DutchSec'
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers',
				organisation: 'Hovenier'
			}
		}
	];

	const fields = [
		generateField('last_name'),
		generateField('first_name', 'last_name'),
		generateField('organisation'),
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
     * Expect:
     * Kuipers --- Dutchsec
     * |
     * |
     * Hovenier
     *
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('parents 3', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				born: 1990,
                organisation: 'DutchSec'
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				born: 1990,
				organisation: 'Hovenier'
			}
		}
	];

	const fields = [
		generateField('first_name'),
	    generateField('born', 'first_name'),
		generateField('organisation'),
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
     * Expect:
     * Thomas --- Dutchsec
     * |     \
     * |      \
     * Harry -- Hovenier
     *
	 */

	expect(nodes.length).toBe(4);
	expect(links.length).toBe(4);
});

test('parents 4', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				born: 1990
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				born: 1990
			}
		}
	];

	const fields = [
		generateField('first_name'),
	    generateField('born', 'first_name'),
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
     * Expect:
     * Thomas
     * |
     * |
     * Harry
     *
	 */
	expect(nodes.length).toBe(2);
	expect(links.length).toBe(1);
	expect(nodes[0].childData).toEqual({ born: ['1990'] });
	expect(nodes[1].childData).toEqual({ born: ['1990'] });
});

test('parents 5 - child data should contain array of all seen values', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers'
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Barry',
				last_name: 'Kuipers'
			}
		}
	];

	const fields = [
		generateField('last_name'),
		generateField('first_name', 'last_name')
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	expect(nodes.length).toBe(1);
	expect(links.length).toBe(0);

	expect(nodes[0].childData.first_name).toContain('Thomas');
});

test('parents 6 - real world case - link sources and targets should exist as nodes', () => {
	const fields = [
		generateField('user.screen_name'),
		generateField('text'),
		generateField('mentions', 'text')
	];

	const items = JSON.parse('[{"id":"a0b245dd3eade2ab840498694d87f53f","fields":{"mentions":["morongwaMow","rn0o0y28","rosybabexoo"],"text":"RT @morongwaMow: @rn0o0y28 @rosybabexoo Exactly wat i was about to ask😂😂 https://t.co/o6YUFQcMLl","user.id_str":"833700754997248002","user.name":"BTS라니아97رانوتان","user.profile_image":"https://pbs.twimg.com/profile_images/1011356197449068544/qHw1eW3T_normal.jpg","user.screen_name":"rn0o0y28"},"count":1,"searchId":"2"}]');


	// What makes this case interesting (and broke it) is that the child node `mentions` has the same value
	// as the parent node `user.screen_name`. The value in question is 'rn0o0y28'.

	const { nodes, links } = getNodesAndLinks([], [], items, fields);

	links.forEach(link => {
		const source = nodes.find(node => node.id === link.source);
		const target = nodes.find(node => node.id === link.target);

		if (!source) {
			console.log(link);

			throw new Error('Source not found' + link.source);
		}

		if (!target) {
			console.log(link);

			throw new Error('Target not found' + link.target);
		}
	});
});

test('parents 7 - a value that is both a child node and a parent node', () => {
	const fields = [
		generateField('last_name'),
		generateField('first_name', 'last_name'),
		generateField('nickname')
	];

	const items = [
		{
			id: '1',
			fields: {
				last_name: 'kuipers',
				first_name: 'thomas',
				nickname: 'thomas',
			}
		}
	];

	const { nodes, links } = getNodesAndLinks([],  [], items as any, fields);

	/**
	 * Expect:
	 * kuipers (child data: first_name: thomas)
	 * |
	 * |
	 * thomas
	 */
	expect(nodes.length).toBe(2);
	expect(links.length).toBe(1);
});

test('parents 8 - should draw links to all parent nodes, not just 1', () => {
	const fields = [
		generateField('first_name'),
		generateField('last_name', 'first_name'),
	];

	const items = [
		{
			id: '1',
			fields: {
				last_name: 'kuipers',
				first_name: 'thomas',
			}
		},
		{
			id: '2',
			fields: {
				last_name: 'kuipers',
				first_name: 'barry',
			}
		},
		{
			id: '3',
			fields: {
				last_name: 'kuipers',
				first_name: 'karel',
			}
		}
	];

	const { nodes, links } = getNodesAndLinks([],  [], items as any, fields);

	/**
	 * Expect:
	 * thomas
	 * |      \
	 * |	   \
	 * barry -- karel
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(3);
});