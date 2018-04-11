export default function deleteFieldFromNodes(field, nodes) {
    nodes = nodes.concat([]);

    nodes.forEach((node, key) => {
        if (node.fields.indexOf(field) === -1) {
            return;
        }

        nodes[key] = Object.assign({}, node, {
            fields: node.fields.filter(fieldLoop => field !== fieldLoop)
        });
    });

    return nodes.filter(node => node.fields.length > 0);
}