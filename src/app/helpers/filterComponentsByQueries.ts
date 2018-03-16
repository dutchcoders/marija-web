import {Node} from "../interfaces/node";

/**
 * Will return a list of components that have at least one node in the specified
 * queries.
 *
 * @param {Node[][]} components
 * @param {string[]} validQueries
 * @returns {Node[][]}
 */
export default function filterComponentsByQueries(components: Node[][], validQueries: string[]) {
    return components.filter(component => {
        const match: Node = component.find(node =>
            node.queries.findIndex(query =>
                validQueries.indexOf(query) !== -1
            ) !== -1
        );

        return typeof match !== 'undefined';
    });
}