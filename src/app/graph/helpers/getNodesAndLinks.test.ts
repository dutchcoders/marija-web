import { uniqueId } from 'lodash';

import {
	getHash,
	default as getNodesAndLinks
} from './getNodesAndLinks';
import {Item} from "../../items/interfaces/item";
import {Field} from "../../fields/interfaces/field";
import { Connector } from '../interfaces/connector';

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
        receivedExtraData: false,
		datasourceId: null
    } as Item;
};

const generateNodeTemplate = (name, fields: string[], strategy = 'OR') => {
	return {
		name: name,
		fields: fields.map(field => ({
			icon: 'a',
			path: field
		})),
		strategy: strategy
	};
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
        // generateNodeTemplate('1', 'text')
    ];

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields);

    expect(nodes.length).toBe(3);
});
//
// test('should not filter nodes that are directly related when searching around a node', () => {
//     const previousNodes = [{
//         id: getHash(1),
// 		name: '1',
//         items: [],
//         fields: [],
//         searchIds: [],
// 		childData: {
//         	client: ['1']
// 		}
//     }, {
//         id: getHash(2),
// 		name: '2',
//         items: [],
//         fields: [],
//         searchIds: [],
// 		childData: {
//         	server: ['2']
// 		}
//     }];
//     const previousLinks = [{
//         source: getHash(1),
//         target: getHash(2),
//         hash: getHash(1) + getHash(2)
//     }];
//
//     const items = [
//         {
//             id: 'vndfnvdfj',
//             fields: {
//                 client: 1,
//                 server: 3
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server')
//     ];
//
//     const aroundNodeId = getHash(1);
//
//     const {nodes, links } = getNodesAndLinks(previousNodes as any, previousLinks as any, items as any, fields, aroundNodeId);
//
//     // 1 node should be added, because the new items were directly related to node id 1
//     expect(nodes.length).toBe(3);
//     expect(links.length).toBe(2);
// });

// test('should not create nodes for empty field values', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         {
//             id: 'vndfnvdfj',
//             fields: {
//                 client: 1,
//                 server: 3
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server'),
//         generateNodeTemplate('nonExisting')
//     ];
//
//     const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
//     expect(nodes.length).toBe(2);
//     expect(links.length).toBe(1);
// });
//
// test('should keep track of item ids, especially when there are multiple lines between 2 nodes', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         {
//             id: '1',
//             fields: {
//                 client: 1,
//                 server: 2
//             }
//         },
//         {
//             id: '2',
//             fields: {
//                 client: 1,
//                 server: 2
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server')
//     ];
//
//     const {nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
//     expect(nodes.length).toBe(2);
//     expect(links.length).toBe(1);
//     expect(links[0].itemIds.length).toBe(2);
// });
//
// test('should not add the same item id multiple times when function is run twice', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         {
//             id: '1',
//             fields: {
//                 client: 1,
//                 server: 2
//             }
//         },
//         {
//             id: '2',
//             fields: {
//                 client: 1,
//                 server: 2
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server')
//     ];
//
//     let result = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//     result = getNodesAndLinks(result.nodes, result.links, items as any, fields);
//
//     expect(result.nodes.length).toBe(2);
//     expect(result.links.length).toBe(1);
//     expect(result.links[0].itemIds.length).toBe(2);
// });
//
// test('should create nodes for array values', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         {
//             id: '1',
//             fields: {
//                 client: [1, 2, 3],
//                 server: 4
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server')
//     ];
//
//
//     const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
//     console.log(nodes);
//
//     expect(nodes.length).toBe(4);
// });
//
// test('should build links between array values', () => {
//     const previousNodes = [];
//     const previousLinks = [];
//
//     const items = [
//         {
//             id: '1',
//             fields: {
//                 client: [1, 2, 3],
//                 server: 4
//             }
//         }
//     ];
//
//     const fields = [
//         generateNodeTemplate('client'),
//         generateNodeTemplate('server')
//     ];
//
//     const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
//     expect(links.length).toBe(3);
// });
//
// test('parents 1', () => {
// 	const previousNodes = [];
// 	const previousLinks = [];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				first_name: 'Thomas',
// 				last_name: 'Kuipers',
//                 organisation: 'DutchSec'
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				first_name: 'Remco',
// 				last_name: 'Verhoef',
// 				organisation: 'DutchSec'
// 			}
// 		}
// 	];
//
// 	const fields = [
// 		generateNodeTemplate('first_name', 'last_name'),
// 		generateNodeTemplate('organisation'),
// 	];
//
// 	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
// 	expect(nodes.length).toBe(3);
// 	expect(links.length).toBe(2);
// });
//
// test('parents 2', () => {
// 	const previousNodes = [];
// 	const previousLinks = [];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				first_name: 'Thomas',
// 				last_name: 'Kuipers',
//                 organisation: 'DutchSec'
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				first_name: 'Harry',
// 				last_name: 'Kuipers',
// 				organisation: 'Hovenier'
// 			}
// 		}
// 	];
//
// 	const fields = [
// 		generateNodeTemplate('first_name', 'last_name'),
// 		generateNodeTemplate('organisation'),
// 	];
//
// 	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
// 	/**
//      * Expect:
//      * Kuipers --- Dutchsec
//      * |
//      * |
//      * Hovenier
//      *
// 	 */
// 	expect(nodes.length).toBe(3);
// 	expect(links.length).toBe(2);
// });
//
// test('parents 3', () => {
// 	const previousNodes = [];
// 	const previousLinks = [];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				first_name: 'Thomas',
// 				born: 1990,
//                 organisation: 'DutchSec'
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				first_name: 'Harry',
// 				born: 1990,
// 				organisation: 'Hovenier'
// 			}
// 		}
// 	];
//
// 	const fields = [
// 	    generateNodeTemplate('first_name', 'born'),
// 		generateNodeTemplate('organisation'),
// 	];
//
// 	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
// 	/**
//      * Expect:
//      * Thomas --- Dutchsec
//      * |
// 	 * 1990
// 	 * |
//      * Harry -- Hovenier
//      *
// 	 */
//
// 	console.log(nodes.map(node => node.name));
//
// 	expect(nodes.length).toBe(5);
// 	expect(links.length).toBe(4);
// });
//
// test('parents 4', () => {
// 	const previousNodes = [];
// 	const previousLinks = [];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				first_name: 'Thomas',
// 				born: 1990
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				first_name: 'Harry',
// 				born: 1990
// 			}
// 		}
// 	];
//
// 	const fields = [
// 		generateNodeTemplate('first_name'),
// 	    generateNodeTemplate('born', 'first_name'),
// 	];
//
// 	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
// 	/**
//      * Expect:
//      * Thomas
//      * |
//      * |
//      * Harry
//      *
// 	 */
// 	expect(nodes.length).toBe(2);
// 	expect(links.length).toBe(1);
// 	expect(nodes[0].childData).toEqual({ born: ['1990'] });
// 	expect(nodes[1].childData).toEqual({ born: ['1990'] });
// });
//
// test('parents 5 - child data should contain array of all seen values', () => {
// 	const previousNodes = [];
// 	const previousLinks = [];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				first_name: 'Thomas',
// 				last_name: 'Kuipers'
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				first_name: 'Barry',
// 				last_name: 'Kuipers'
// 			}
// 		}
// 	];
//
// 	const fields = [
// 		generateNodeTemplate('last_name'),
// 		generateNodeTemplate('first_name', 'last_name')
// 	];
//
// 	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);
//
// 	expect(nodes.length).toBe(1);
// 	expect(links.length).toBe(0);
//
// 	expect(nodes[0].childData.first_name).toContain('Thomas');
// });
//
// test('parents 6 - real world case - link sources and targets should exist as nodes', () => {
// 	const fields = [
// 		generateNodeTemplate('user.screen_name'),
// 		generateNodeTemplate('text'),
// 		generateNodeTemplate('mentions', 'text')
// 	];
//
// 	const items = JSON.parse('[{"id":"a0b245dd3eade2ab840498694d87f53f","fields":{"mentions":["morongwaMow","rn0o0y28","rosybabexoo"],"text":"RT @morongwaMow: @rn0o0y28 @rosybabexoo Exactly wat i was about to ask😂😂 https://t.co/o6YUFQcMLl","user.id_str":"833700754997248002","user.name":"BTS라니아97رانوتان","user.profile_image":"https://pbs.twimg.com/profile_images/1011356197449068544/qHw1eW3T_normal.jpg","user.screen_name":"rn0o0y28"},"count":1,"searchId":"2"}]');
//
//
// 	// What makes this case interesting (and broke it) is that the child node `mentions` has the same value
// 	// as the parent node `user.screen_name`. The value in question is 'rn0o0y28'.
//
// 	const { nodes, links } = getNodesAndLinks([], [], items, fields);
//
// 	links.forEach(link => {
// 		const source = nodes.find(node => node.id === link.source);
// 		const target = nodes.find(node => node.id === link.target);
//
// 		if (!source) {
// 			console.log(link);
//
// 			throw new Error('Source not found' + link.source);
// 		}
//
// 		if (!target) {
// 			console.log(link);
//
// 			throw new Error('Target not found' + link.target);
// 		}
// 	});
// });
//
// test('parents 7 - a value that is both a child node and a parent node', () => {
// 	const fields = [
// 		generateNodeTemplate('last_name'),
// 		generateNodeTemplate('first_name', 'last_name'),
// 		generateNodeTemplate('nickname')
// 	];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'thomas',
// 				nickname: 'thomas',
// 			}
// 		}
// 	];
//
// 	const { nodes, links } = getNodesAndLinks([],  [], items as any, fields);
//
// 	/**
// 	 * Expect:
// 	 * kuipers (child data: first_name: thomas)
// 	 * |
// 	 * |
// 	 * thomas
// 	 */
// 	expect(nodes.length).toBe(2);
// 	expect(links.length).toBe(1);
// });
//
// test('parents 8 - should draw links to all parent nodes, not just 1', () => {
// 	const fields = [
// 		generateNodeTemplate('first_name'),
// 		generateNodeTemplate('last_name', 'first_name'),
// 	];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'thomas',
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'barry',
// 			}
// 		},
// 		{
// 			id: '3',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'karel',
// 			}
// 		}
// 	];
//
// 	const { nodes, links } = getNodesAndLinks([],  [], items as any, fields);
//
// 	/**
// 	 * Expect:
// 	 * thomas
// 	 * |      \
// 	 * |	   \
// 	 * barry -- karel
// 	 */
// 	expect(nodes.length).toBe(3);
// 	expect(links.length).toBe(3);
// });
//
// test('parents 9 - links should be labeled', () => {
// 	const fields = [
// 		generateNodeTemplate('first_name'),
// 		generateNodeTemplate('last_name', 'first_name'),
// 	];
//
// 	const items = [
// 		{
// 			id: '1',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'thomas',
// 			}
// 		},
// 		{
// 			id: '2',
// 			fields: {
// 				last_name: 'kuipers',
// 				first_name: 'barry',
// 			}
// 		},
// 	];
//
// 	const { nodes, links } = getNodesAndLinks([],  [], items as any, fields);
//
// 	/**
// 	 * Expect:
// 	 * thomas
// 	 * |
// 	 * |kuipers
// 	 * |
// 	 * barry
// 	 */
// 	expect(nodes.length).toBe(2);
// 	expect(links.length).toBe(1);
// 	expect(links[0].label).toBe('kuipers');
// });

test('node templates 1', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers
	 * |
	 * Harry
	 *
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('node templates 2', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			}
		},
		{
			id: '3',
			fields: {
				first_name: 'Barry',
				last_name: 'Kuipers'
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers --- Barry
	 * |
	 * Harry
	 *
	 */
	expect(nodes.length).toBe(4);
	expect(links.length).toBe(3);
});

test('node templates 3', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: ['Harry', 'Barry'],
				last_name: 'Kuipers'
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers
	 * |
	 * [Harry, Barry]
	 *
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('node templates 4', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: ['Boer', 'Kuipers']
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers
	 * |
	 * Harry
	 *
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('node templates 5', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				born: 1990,
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				born: 1990,
				last_name: 'Kuipers'
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name']),
		generateNodeTemplate('born_in_same_year', ['born'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
	 * Expect:
	 * 		 Thomas
	 * 		 /    \
	 * Kuipers   1990
	 *       \   /
	 *       Harry
	 *
	 */
	expect(nodes.length).toBe(4);
	expect(links.length).toBe(4);
});

test('node templates 6', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			}
		},
		{
			id: '3',
			fields: {
				first_name: 'Henk',
				last_name: 'Boer'
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers
	 * |
	 * Harry
	 *
	 * Henk
	 *
	 */
	expect(nodes.length).toBe(4);
	expect(links.length).toBe(2);
});

test('node templates 7', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
				born: 1990
			}
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers',
				born: 1980
			}
		},
		{
			id: '3',
			fields: {
				first_name: 'Henk',
				last_name: 'Boer',
				born: 1980
			}
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name']),
		generateNodeTemplate('born_same_year', ['born']),
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields);

	/**
	 * Expect:
	 * Thomas
	 * |
	 * Kuipers
	 * |
	 * Harry
	 * |
	 * 1980
	 * |
	 * Henk
	 *
	 */
	expect(nodes.length).toBe(5);
	expect(links.length).toBe(4);
});

test('should output separate connectors for each connecting array value', () => {
	const items = [
		{
			id: '1',
			fields: {
				name: 'Thomas',
				nicknames: ['Dude', 'Man'],
			}
		},
		{
			id: '2',
			fields: {
				name: 'Barry',
				nicknames: ['Dude', 'Man'],
			}
		}
	];

	const fields = [
		generateNodeTemplate('nicknames', ['nicknames'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields);

	/**
	 * Expect
	 * Thomas -- Dude
	 *        \/
	 *        /\
	 *       /  \
	 * Barry --- Man
	 */
	expect(nodes.length).toBe(4);
	expect(links.length).toBe(4);
});

test('connector nodes should contain item ids of all related items', () => {
	const items = [
		{
			id: '1',
			fields: {
				name: 'Thomas',
			}
		},
		{
			id: '2',
			fields: {
				name: 'Thomas',
			}
		}
	];

	const fields = [
		generateNodeTemplate('name', ['name'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields);

	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);

	const connector = nodes.find(node => node.type === 'intersection');

	expect(connector.items.length).toBe(2);
});
