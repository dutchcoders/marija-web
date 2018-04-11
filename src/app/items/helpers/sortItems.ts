import {Item} from '../../graph/interfaces/item';
import {Column} from "../../table/interfaces/column";
import {SortType} from "../../table/interfaces/sortType";

export function sortItems(items: Item[], sortBy: Column, type: SortType): Item[] {
    items = items.concat([]);

    items.sort((a, b) => {
        if (type === 'asc') {
            if (a.fields[sortBy] < b.fields[sortBy]) {
                return -1;
            }

            if (a.fields[sortBy] > b.fields[sortBy]) {
                return 1;
            }
        }

        if (type === 'desc') {
            if (a.fields[sortBy] > b.fields[sortBy]) {
                return -1;
            }

            if (a.fields[sortBy] < b.fields[sortBy]) {
                return 1;
            }
        }

        return 0;
    });

    return items;
}