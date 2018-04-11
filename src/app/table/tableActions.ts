import { Column } from './interfaces/column';
import { TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, TABLE_SORT } from './tableConstants';

export function tableColumnRemove(field) {
    return {
        type: TABLE_COLUMN_REMOVE,
        receivedAt: Date.now(),
        field: field
    };
}

export function tableColumnAdd(field) {
    return {
        type: TABLE_COLUMN_ADD,
        receivedAt: Date.now(),
        field: field
    };
}

export function tableSort(column: Column, type: 'asc' | 'desc') {
    return {
        type: TABLE_SORT,
        payload: {
            column: column,
            type: type
        }
    };
}