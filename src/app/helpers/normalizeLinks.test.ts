import normalizeNodes from "./normalizeNodes";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import normalizeLinks from "./normalizeLinks";
import {uniqueId} from 'lodash';

const generateLink = (source, target): Link => {
    return {
        source: source,
        target: target
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
    const links = [
        generateLink('something', 'bello'),
        generateLink('something', 'hello')
    ];

    const normalizations = [
        generateNormalization('^[bh]ello$', 'hello')
    ];

    const result = normalizeLinks(links, normalizations);

    expect(result.length).toBe(3);
});

test('should merge links when source gets normalized', () => {
    const links = [
        generateLink('bello', 'something'),
        generateLink('hello', 'something')
    ];

    const normalizations = [
        generateNormalization('^[bh]ello$', 'hello')
    ];

    const result = normalizeLinks(links, normalizations);

    expect(result.length).toBe(3);
});

test('should work when both source and target get normalized', () => {
    const links = [
        generateLink('bello', 'cello'),
        generateLink('hello', 'something')
    ];

    const normalizations = [
        generateNormalization('^[bhc]ello$', 'hello')
    ];

    const result = normalizeLinks(links, normalizations);

    expect(result.length).toBe(3);

    const parent = result.find(link => link.isNormalizationParent);

    expect(parent.source).toBe('hello');
    expect(parent.target).toBe('something');
});

// todo: this is complicated. also think about denormalizing in different order
test('should work when applying multiple normalizations', () => {
    /**
     * input:
     *
     * bello ------ cello
     * |            |
     * |            |
     * |            |
     * hoy ------- boy
     *
     * expected result:
     *
     * hello
     * |
     * |
     * |
     * hoy
     */

    const links = [
        generateLink('bello', 'cello'),
        generateLink('bello', 'hoy'),
        generateLink('cello', 'boy'),
        generateLink('boy', 'hoy'),
    ];

    const normalizations = [
        generateNormalization('^[bhc]ello$', 'hello'),
        generateNormalization('^[hb]oy$', 'hoy'),
    ];

    let result = normalizeLinks(links, normalizations);

    const linksForDisplay = result.filter(link => link.isNormalizationParent || link.normalizationId === null);

    expect(linksForDisplay.length).toBe(1);
    //
    // const parent = result.find(link => link.isNormalizationParent);
    //
    // expect(parent.source).toBe('hello');
    // expect(parent.target).toBe('hoy');
});