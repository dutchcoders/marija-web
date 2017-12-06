import {fieldLocator} from './index';
import {forEach} from 'lodash';

export default function getHighlightItem (highlightItem, node, fields) {
    // Only keep the fields that the user configured for brevity
    forEach(highlightItem.fields, (value, path) => {
        let myValue = fieldLocator(highlightItem.fields, path);

        const fieldActive = typeof fields.find(field => field.path === path) !== 'undefined';

        if (!fieldActive) {
            delete highlightItem.fields[path];
        }
    });

    highlightItem.x = node.x;
    highlightItem.y = node.y;
    highlightItem.matchFields = node.fields;

    return highlightItem;
}