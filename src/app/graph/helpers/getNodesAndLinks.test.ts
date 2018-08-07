import { uniqueId } from 'lodash';

import {
	default as getNodesAndLinks
} from './getNodesAndLinks';
import {Item} from "../interfaces/item";
import {Field} from "../../fields/interfaces/field";
import { Connector } from '../interfaces/connector';
import { getNumericHash } from './getNumericHash';

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
		datasourceId: '1',
		display: true
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

const defaultArguments: any = [
	null,
	[],
	[{
		id: '1',
		labelFieldPath: 'first_name'
	}]
];

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

    const { nodes } = getNodesAndLinks(previousNodes, previousLinks, items, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				first_name: 'Barry',
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: ['Harry', 'Barry'],
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: ['Boer', 'Kuipers']
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['first_name', 'last_name'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				born: 1990,
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name']),
		generateNodeTemplate('born_in_same_year', ['born'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				first_name: 'Henk',
				last_name: 'Boer'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name'])
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: 'Harry',
				last_name: 'Kuipers',
				born: 1980
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				first_name: 'Henk',
				last_name: 'Boer',
				born: 1980
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name']),
		generateNodeTemplate('born_same_year', ['born']),
	] as any;

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'Barry',
				nicknames: ['Dude', 'Man'],
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('nicknames', ['nicknames'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields, ...defaultArguments);

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
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('name', ['name'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields, ...defaultArguments);

	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);

	const connector = nodes.find(node => node.type === 'connector');

	expect(connector.items.length).toBe(2);
});

test('connector nodes should contain item ids of all related items when there are more than 2 items', () => {
	const items = [
		{
			id: '1',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('name', ['name'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields, ...defaultArguments);

	expect(nodes.length).toBe(4);
	expect(links.length).toBe(3);

	const connector = nodes.find(node => node.type === 'connector');

	expect(connector.items.length).toBe(3);
});

test('should work with word similarity percentages', () => {
	const items = [
		{
			id: '1',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'Thomat',
			},
			datasourceId: '1',
			display: true
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

	const { nodes, links } = getNodesAndLinks([], [], items as any, connectors, ...defaultArguments);

	expect(nodes.length).toBe(3);
});

test('connector should contain all values when working with word similarity percentages', () => {
	const items = [
		{
			id: '1',
			fields: {
				name: 'Thomas',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'Thomat',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				name: 'Thomab',
			},
			datasourceId: '1',
			display: true
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

	const { nodes, links } = getNodesAndLinks([], [], items as any, connectors, ...defaultArguments);

	expect(nodes.length).toBe(4);

	const connector = nodes.find(node => node.type === 'connector');

	expect(connector.childData.name.length).toBe(3);
});

test('should find relations with nodes that already existed', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'thomas',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('name', ['name'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

	expect(nodes.length).toBe(1);
	expect(links.length).toBe(0);

	const items2 = [
		{
			id: '2',
			fields: {
				name: 'thomas',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const allItems = items1.concat(items2);
	const result = getNodesAndLinks(nodes, links, allItems as any, fields, ...defaultArguments);

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
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				company: 'dutchsec',
				city: null
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('1', ['company', 'city'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

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
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				lastName: null,
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('1', ['lastName'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

	/**
	 * Expect:
	 * thomas
	 *
	 * harry
	 */
	expect(nodes.length).toBe(2);
	expect(links.length).toBe(0);
});

test('should not create connector nodes for empty values', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'thomas',
				lastName: '',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				lastName: '',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('1', ['lastName'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

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
				},
			},
			{
				id: '13',
				field: {
					path: 'bsn_persgev',
					type: 'text',
					datasourceId: 'a'
				},
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
			datasourceId: '1',
			searchId: '3',
			display: true
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
			datasourceId: '1',
			searchId: '3',
			display: true
		}];

	const { nodes, links } = getNodesAndLinks([], [], items, [connector], ...defaultArguments);

	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('boukes case', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'bouke',
				brother: 'harry',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				brother: 'karel',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('1', ['name', 'brother'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

	/**
	 * Expect:
	 * bouke
	 * |
	 * brother/name: harry
	 * |
	 * harry
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('boukes case 2', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				name: 'bouke',
				brother: 'harry',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				name: 'harry',
				brother: 'karel',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				name: 'thomas',
				brother: 'harry',
			},
			searchId: 'q',
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('1', ['name', 'brother'])
	] as any;

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, fields, ...defaultArguments);

	/**
	 * Expect:
	 * bouke
	 * |
	 * brother/name: harry --- thomas
	 * |
	 * harry
	 */
	expect(nodes.length).toBe(4);
	expect(links.length).toBe(3);
});

test('real world case - one valueset can have multiple connectors', () => {
	const items1 = [
		{
			id: '1',
			fields: {
				mentions: 'argenisdarienzo'
			},
			count: 1,
			datasource: 'twitter-tweets',
			datasourceId: 'twitter-tweets',
			searchId: '3',
			display: true
		},
		{
			id: '2',
			fields: {
				mentions: 'NorahODonnell'
			},
			count: 1,
			datasource: 'twitter-tweets',
			datasourceId: 'twitter-tweets',
			searchId: '3',
			display: true
		},
		{
			id: '3',
			fields: {
				mentions: 'NormEisen',
			},
			count: 1,
			datasource: 'twitter-tweets',
			datasourceId: 'twitter-tweets',
			searchId: '3',
			display: true
		},
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
					path: 'mentions',
					type: 'text',
					datasourceId: '1'
				},
				similarity: 26
			}]
		}
	];

	const datasources: any = [{
		id: 'twitter-tweets',
		labelFieldPath: 'mentions'
	}];

	const { nodes, links } = getNodesAndLinks([], [], items1 as any, connectors, null, [], datasources);

	const connector = nodes.find(node => node.type === 'connector' && node.childData.mentions && node.childData.mentions[0] === 'NorahODonnell');

	if (connector) {
		const connectedLinks = links.filter(link => link.target === connector.id || link.source === connector.id);

		if (connectedLinks.length < 2) {
			fail('There is a connector with less than 2 links');
		}
	}
});

test('node templates 10', () => {
	const previousNodes = [];
	const previousLinks = [];

	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				first_name: ['Harry', 'barry'],
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('family', ['last_name']),
		generateNodeTemplate('2', ['first_name']),
	];

	const { nodes, links } = getNodesAndLinks(previousNodes, previousLinks, items as any, fields as any, ...defaultArguments);

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

test('should match with OR connector when 1 of the fields is undefined', () => {
	const items = [
		{
			id: '1',
			fields: {
				first_name: 'Thomas',
				last_name: 'Kuipers',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				last_name: 'Kuipers'
			},
			datasourceId: '1',
			display: true
		}
	];

	const fields = [
		generateNodeTemplate('names', ['last_name', 'first_name']),
	];

	const { nodes, links } = getNodesAndLinks([], [], items as any, fields as any, ...defaultArguments);

	/**
	 * Expect:
	 * 1
	 * |
	 * Kuipers
	 * |
	 * 2
	 *
	 */
	expect(nodes.length).toBe(3);
	expect(links.length).toBe(2);
});

test('should work with distances', () => {
	// 51,5 and 51,4 should be 70km apart
	const items = [
		{
			id: '1',
			fields: {
				location: '51,5',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				location: '51,4',
			},
			datasourceId: '1',
			display: true
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
					path: 'location',
					type: 'location',
					datasourceId: '1'
				},
				distance: 80
			}]
		}
	];

	const { nodes, links } = getNodesAndLinks([], [], items as any, connectors, ...defaultArguments);

	expect(nodes.length).toBe(3);
});

test('OR connector with 3 fields should work', () => {
	const items = [
		{
			id: '1',
			fields: {
				ip: 'a',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '2',
			fields: {
				sourceIp: 'a',
			},
			datasourceId: '1',
			display: true
		},
		{
			id: '3',
			fields: {
				destIp: 'a',
			},
			datasourceId: '1',
			display: true
		}
	];

	const connectors = [
		generateNodeTemplate('names', ['ip', 'sourceIp', 'destIp']),
	];

	const { nodes, links } = getNodesAndLinks([], [], items as any, connectors as any, ...defaultArguments);
});