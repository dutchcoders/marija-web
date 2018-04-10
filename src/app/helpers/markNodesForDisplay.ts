/**
 * Sets the property display of the nodes to true or false.
 *
 * @param nodes
 * @param searches
 * @returns {Array}
 */
import {Node} from "../modules/graph/interfaces/node";
import {Search} from "../modules/search/interfaces/search";

export default function markNodesForDisplay(nodes: Node[], searches: Search[]) {
    const searchesCounter = {};
    const nodesForDisplay = [];
    const max = {};

    searches.forEach(search => max[search.searchId] = search.displayNodes);

    nodes.forEach(node => {
        let display = true;

        node.searchIds.forEach(searchId => {
            if (searchesCounter[searchId]) {
                searchesCounter[searchId] ++;
            } else {
                searchesCounter[searchId] = 1;
            }

            if (searchesCounter[searchId] > max[searchId]) {
                display = false;
            }
        });

        nodesForDisplay.push(Object.assign({}, node, {
            display: display
        }));
    });

    return nodesForDisplay;
}