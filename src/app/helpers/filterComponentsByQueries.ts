import {Node} from "../interfaces/node";

/**
 * Will return a list of components that have at least one node in the specified
 * queries.
 *
 * @param {Node[][]} components
 * @param {string[]} queries
 * @returns {Node[][]}
 */
export default function filterComponentsByQueries(components: Node[][], queries: string[] = []) {
    return components.filter(component => {
        const match = component.find(node =>
            node.queries.findIndex(query => queries.indexOf(query) !== -1) !== -1
        );

        return typeof match !== 'undefined';
    });
}