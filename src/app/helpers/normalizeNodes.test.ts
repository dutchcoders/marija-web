import {Node} from "../interfaces/node";
import {uniqueId} from 'lodash';
import normalizeNodes from "./normalizeNodes";
import {Normalization} from "../interfaces/normalization";

const generateNode = (id): Node => {
    return {
        id: id,
        name: id
    } as Node
};

const generateNormalization = (regex: string, replaceWith: string): Normalization => {
    return {
        id: uniqueId(),
        regex: regex,
        replaceWith: replaceWith
    };
};

test('should merge nodes', () => {
    const nodes = [
        generateNode('hello'),
        generateNode('bello')
    ];

    const normalization = generateNormalization('^[bh]ello$', 'hello');
    const result = normalizeNodes(nodes, [normalization]);

    expect(result.length).toBe(3);
    expect(result.filter(node => node.isNormalizationParent).length).toBe(1);
    expect(result.filter(node => node.normalizationId === normalization.id).length).toBe(3);
});


test('should work when applying normalizations to already normalized nodes', () => {
    const nodes = [
        generateNode('bello'),
        generateNode('hello'),
        generateNode('something')
    ];

    const normalization1 = generateNormalization('^[bh]ello$', 'hello');
    const result = normalizeNodes(nodes, [normalization1]);

    expect(result.length).toBe(4);

    const result2 = normalizeNodes(nodes, [normalization1]);

    // Should not have changed when running it twice
    expect(result2).toEqual(result);

    const normalization2 = generateNormalization('^something$', 'else');
    const result3 = normalizeNodes(result2, [normalization1, normalization2]);

    expect(result3.length).toBe(5);
    expect(result3.filter(node => node.isNormalizationParent).length).toBe(2);
    expect(result3.filter(node => node.normalizationId === normalization1.id).length).toBe(3);
    expect(result3.filter(node => node.normalizationId === normalization2.id).length).toBe(2);
});

test('should be case-insensitive', () => {
    const nodes = [
        generateNode('hello'),
        generateNode('Bello')
    ];

    const normalization = generateNormalization('^[bh]ello$', 'hello');
    const result = normalizeNodes(nodes, [normalization]);

    expect(result.length).toBe(3);
    expect(result.filter(node => node.isNormalizationParent).length).toBe(1);
    expect(result.filter(node => node.normalizationId === normalization.id).length).toBe(3);
});