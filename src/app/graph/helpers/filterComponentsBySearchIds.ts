import {Node} from "../interfaces/node";

/**
 * Will return a list of components that have at least one node in the specified
 * searchIds.
 *
 * @param {Node[][]} components
 * @param {string[]} validSearchIds
 * @returns {Node[][]}
 */
export default function filterComponentsBySearchIds(components: Node[][], validSearchIds: string[]) {
    return components.filter(component => {
        const match: Node = component.find(node =>
            node.searchIds.findIndex(query =>
                validSearchIds.indexOf(query) !== -1
            ) !== -1
        );

        return typeof match !== 'undefined';
    });
}