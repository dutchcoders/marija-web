import normalizeNodes from "./normalizeNodes";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import normalizeLinks from "./normalizeLinks";
import {uniqueId} from 'lodash';

const generateNode = (id: number, name: string): Node => {
    return {
        id,
        name
    } as Node;
};

const generateLink = (source: number, target: number): Link => {
    return {
        source: source,
        target: target,
		normalizationIds: []
    } as Link
};

const generateNormalization = (regex: string, replaceWith: string): Normalization => {
    return {
        id: uniqueId(),
        regex: regex,
        replaceWith: replaceWith
    };
};

test('should merge links when target gets normalized', () => {
	const normalizations = [
		generateNormalization('^[bh]ello$', 'hello')
	];

    const nodes = normalizeNodes([
        generateNode(1, 'something'),
        generateNode(2, 'bello'),
        generateNode(3, 'hello'),
    ], normalizations);

    const links = [
        generateLink(1, 2),
        generateLink(1, 3)
    ];

	/**
     * Start with:
     * something ----- bello
     * |
     * |
	 * hello
     *
     * End with:
     * something
     * |
     * |
     * hello
	 */

	const result = normalizeLinks(nodes, links, normalizations);

	// Should have 2 normalization children (the links that got normalized)
	expect(result.filter(link => !link.isNormalizationParent).length).toBe(2);

	// Should have 1 normalization parent (the result). This is the only link that would be displayed on the graph
	expect(result.filter(link => link.isNormalizationParent).length).toBe(1);

	// So 3 links in total
	expect(result.length).toBe(3);
});

test('should merge links when source gets normalized', () => {
	const normalizations = [
		generateNormalization('^[bh]ello$', 'hello')
	];

	const nodes = normalizeNodes([
		generateNode(1, 'something'),
		generateNode(2, 'bello'),
		generateNode(3, 'hello'),
	], normalizations);

    const links = [
        generateLink(2, 1),
        generateLink(3, 1)
    ];

    const result = normalizeLinks(nodes, links, normalizations);

    expect(result.length).toBe(3);
});

test('should work when both source and target get normalized', () => {
	const normalizations = [
		generateNormalization('^[hc]ello$', 'hello'),
		generateNormalization('^[sb]omething$', 'something'),
	];

	const nodes = normalizeNodes([
		generateNode(1, 'something'),
		generateNode(2, 'bomething'),
		generateNode(3, 'hello'),
		generateNode(4, 'cello'),
	], normalizations);

    const links = [
        generateLink(1, 3),
        generateLink(2, 4)
    ];

	/**
	 * Start with:
	 * something ----- hello
	 * bomething ----- cello
	 *
	 * End with:
	 * something ----- hello
	 */

	const result = normalizeLinks(nodes, links, normalizations);

    expect(result.length).toBe(3);

    const children = result.filter(link => link.normalizationIds.length && !link.isNormalizationParent);
    expect(children.length).toBe(2);

    const parents = result.filter(link => link.normalizationIds.length && link.isNormalizationParent);
    expect(parents.length).toBe(1);
});

test('should work when both source and target get normalized 2', () => {
	const normalizations = [
		generateNormalization('^[bhc]ello$', 'hello')
	];

	const nodes = normalizeNodes([
		generateNode(1, 'something'),
		generateNode(2, 'bello'),
		generateNode(3, 'hello'),
		generateNode(4, 'cello'),
	], normalizations);

    const links = [
        generateLink(2, 4),
        generateLink(3, 1)
    ];

	/**
	 * Start with:
	 * something ----- hello
	 * bello --------- cello
	 *
	 * End with:
	 * something ----- hello
	 */

	const result = normalizeLinks(nodes, links, normalizations);

    expect(result.length).toBe(3);

    const parent = result.find(link => link.isNormalizationParent);
    const normalizedNode = nodes.find(node => node.isNormalizationParent);

    expect(parent.source).toBe(normalizedNode.id);
    expect(parent.target).toBe(1);
});


//
// // todo: this is complicated. also think about denormalizing in different order
// test('should work when applying multiple normalizations', () => {
//     /**
//      * input:
//      *
//      * bello ------ cello
//      * |            |
//      * |            |
//      * |            |
//      * hoy ------- boy
//      *
//      * expected result:
//      *
//      * hello
//      * |
//      * |
//      * |
//      * hoy
//      */
//
//     const links = [
//         generateLink('bello', 'cello'),
//         generateLink('bello', 'hoy'),
//         generateLink('cello', 'boy'),
//         generateLink('boy', 'hoy'),
//     ];
//
//     const normalizations = [
//         generateNormalization('^[bhc]ello$', 'hello'),
//         generateNormalization('^[hb]oy$', 'hoy'),
//     ];
//
//     let result = normalizeLinks(links, normalizations);
//
//     const linksForDisplay = result.filter(link => link.isNormalizationParent || link.normalizationId === null);
//
//     expect(linksForDisplay.length).toBe(1);
//     //
//     // const parent = result.find(link => link.isNormalizationParent);
//     //
//     // expect(parent.source).toBe('hello');
//     // expect(parent.target).toBe('hoy');
// });