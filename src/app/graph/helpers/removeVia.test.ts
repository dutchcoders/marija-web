import {Via} from "../interfaces/via";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import removeVia from "./removeVia";

const generateNode = (id: string, fields: string[]) => {
    return {
        id: id,
        name: id,
        fields: fields
    } as any
};

const generateLink = (source: string, target: string, label?: string, viaId?: string, replacedNode?: Node) => {
    return {
        source: source,
        target: target,
        label: label,
        viaId: viaId,
        replacedNode: replacedNode
    } as any;
};

test('should remove labeled links',  () => {
    const remove: Via = {
        id: '1',
        from: 'client',
        to: 'server',
        via: 'port',
    };

    const inputNodes: Node[] = [
        generateNode('1', ['client']),
        generateNode('2', ['server'])
    ];

    const inputLinks: Link[] = [
        generateLink('1', '2', '80', '1', generateNode('80', ['port']))
    ];

    const { nodes, links } = removeVia(inputNodes, inputLinks, remove);

    expect(nodes.length).toBe(3);
    expect(links.length).toBe(3);
});