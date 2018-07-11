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
		rules: fields.map(field => ({
			id: uniqueId(),
			field: {
				icon: 'a',
				path: field
			}
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

	const connector = nodes.find(node => node.type === 'connector');

	expect(connector.items.length).toBe(2);
});

test('should work with word similarity percentages', () => {
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
				name: 'Thomat',
			}
		}
	];

	const connectors: Connector[] = [
		{
			name: '1',
			strategy: 'AND',
			icon: 'x',
			color: '',
			rules: [{
				id: '1',
				field: {
					path: 'name',
					type: 'text',
					datasourceId: '1'
				},
				similarity: 80
			}]
		}
	];

	const { nodes, links } = getNodesAndLinks([], [], items as any, connectors);

	expect(nodes.length).toBe(3);
});

test('should find relations with nodes that already existed', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'thomas',
			},
			searchId: 'q'
		}
	];

	const fields = [
		generateNodeTemplate('name', ['name'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields);

	expect(nodes.length).toBe(1);
	expect(links.length).toBe(0);

	const items2 = [
		{
			id: '2',
			fields: {
				name: 'thomas',
			},
			searchId: 'q'
		}
	];

	const allItems = items1.concat(items2);
	const result = getNodesAndLinks(nodes, links, allItems as any, fields);

	expect(result.nodes.length).toBe(3);
	expect(result.links.length).toBe(2);
});

test('should work with OR match when one of the values is null', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'thomas',
				company: 'dutchsec',
				city: 'utrecht'
			},
			searchId: 'q'
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				company: 'dutchsec',
				city: null
			},
			searchId: 'q'
		}
	];

	const fields = [
		generateNodeTemplate('1', ['company', 'city'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields);

	/**
	 * Expect:
	 * thomas
	 * |
	 * utrecht
	 * |
	 * harry
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('should not create connector nodes for null values', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'thomas',
				lastName: null,
			},
			searchId: 'q'
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				lastName: null,
			},
			searchId: 'q'
		}
	];

	const fields = [
		generateNodeTemplate('1', ['lastName'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields);

	/**
	 * Expect:
	 * thomas
	 *
	 * harry
	 */
	expect(nodes.length).toBe(2);
	expect(links.length).toBe(0);
});

test('real world case', () => {
	const connector: any = {
		name: '6',
		rules: [
			{
				id: '5',
				field: {
					path: 'bsn',
					type: 'text',
					datasourceId: 'a'
				}
			},
			{
				id: '13',
				field: {
					path: 'bsn_persgev',
					type: 'text',
					datasourceId: 'a'
				}
			}
		],
		strategy: 'OR',
		icon: 'B',
		color: '3772592'
	};

	const items: any = [{
			id: '1',
			fields:
				{
					bsn: 'same',
					bsn_persgev: 'diff',
				},
			count: 1,
			datasource: 'a',
			datasourceId: 'a',
			searchId: '3'
		},
		{
			id: '2',
			fields:
				{
					bsn: 'diff2',
					bsn_persgev: 'same',
				},
			count: 1,
			datasource: 'a',
			datasourceId: 'a',
			searchId: '3'
		}];

	const { nodes, links } = getNodesAndLinks([], [], items, [connector]);

	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});