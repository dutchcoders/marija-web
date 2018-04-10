import {
    TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE,
    TABLE_SORT
} from './tableConstants';
import {Column} from "./interfaces/column";
import {FIELD_ADD, FIELD_DELETE} from "../data/constants";

export interface TableState {
    columns: Column[];
    sortColumn: Column;
    sortType: 'asc' | 'desc'
}

export const defaultTableState: TableState = {
    columns: [],
    sortColumn: null,
    sortType: 'asc'
};

export default function tableReducer(state: TableState = defaultTableState, action): TableState {
    switch (action.type) {
        case TABLE_COLUMN_ADD: {
            return {
                ...state,
                columns: state.columns.concat(action.field)
            };
        }

        case TABLE_COLUMN_REMOVE: {
            let sortColumn = state.sortColumn;

            if (action.field === sortColumn) {
                sortColumn = null;
            }

            return {
                ...state,
                columns: state.columns.filter(column => column !== action.field),
                sortColumn: sortColumn
            };
        }

        case TABLE_SORT: {
            // Actual sorting is done in the graphReducer, here we just save the state

            return {
                ...state,
                sortColumn: action.payload.column,
                sortType: action.payload.type
            };
        }

        case FIELD_ADD: {
            if (state.columns.length >= 3) {
                // Only continue if we don't have enough fields yet
                return state;
            }

            // Automatically add the new field as a column
            let columns = state.columns.concat([action.field.path]);

            return {
                ...state,
                columns: columns
            };
        }

        case FIELD_DELETE: {
            if (state.columns.indexOf(action.field.path) === -1) {
                // If the field was not used as a column we don't do anything here
                return state;
            }

            // If the field was used as a column in the table, delete that column
            const columns = state.columns.filter(column =>
                column !== action.field.path
            );
            let sortColumn = state.sortColumn;

            if (action.field.path === sortColumn) {
                sortColumn = null;
            }

            return {
                ...state,
                sortColumn: sortColumn,
                columns: columns
            }
        }

        default:
            return state;
    }
}