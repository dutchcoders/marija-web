import normalizeNodes from "./normalizeNodes";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import normalizeLinks from "./normalizeLinks";

const generateLink = (source, target): Link => {
    return {
        source: source,
        target: target
    } as Link
};

const generateNormalization = (regex: string, replaceWith: string): Normalization => {
    return {
        regex: regex,
        replaceWith: replaceWith,
        affectedNodes: [],
        affectedLinks: []
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

    expect(result.links.length).toBe(1);
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

    expect(result.links.length).toBe(1);
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

    expect(result.links.length).toBe(1);
    expect(result.links[0].source).toBe('hello');
    expect(result.links[0].target).toBe('something');
});

test('should mark newly created links as normalized', () => {
    const links = [
        generateLink('bello', 'something')
    ];

    const normalizations = [
        generateNormalization('^[bh]ello$', 'hello')
    ];

    const result = normalizeLinks(links, normalizations);

    expect(result.links[0].source).toBe('hello');
});