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
        replaceWith: replaceWith,
        affectedNodes: [],
        affectedLinks: []
    };
};

test('should merge nodes', () => {
    const nodes = [
        generateNode('hello'),
        generateNode('bello')
    ];

    const normalizations = [
        generateNormalization('^[bh]ello$', 'hello')
    ];

    const result = normalizeNodes(nodes, normalizations);

    expect(result.nodes.length).toBe(1);
    expect(result.normalizations[0].affectedNodes.length).toBe(1);
    expect(result.normalizations[0].affectedNodes[0].id).toBe('bello');
});

test('should mark newly created nodes as normalized', () => {
    const nodes = [
        generateNode('bello')
    ];

    const normalizations = [
        generateNormalization('^[bh]ello$', 'hello')
    ];

    const result = normalizeNodes(nodes, normalizations);

    expect(result.nodes[0].id).toBe('hello');
    expect(result.nodes[0].normalizationId).not.toBeNull();
});