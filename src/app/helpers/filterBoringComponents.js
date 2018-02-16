import {uniq} from 'lodash';

/**
 * Filters connected components that contain nodes that are based on only 1 item.
 * This prevents very small connected components cluttering the graph.
 *
 * @param components
 */
export default function filterBoringComponents(components) {
    return components.filter(nodes => {
        let itemIds = [];

        nodes.forEach(node => {
            itemIds = itemIds.concat(node.items);
        });

        return uniq(itemIds).length > 1;
    });
}