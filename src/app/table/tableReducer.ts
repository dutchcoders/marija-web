import {
    TABLE_COLUMN_ADD,
    TABLE_COLUMN_REMOVE,
    TABLE_SORT
} from './tableConstants';
import {TableState} from "./interfaces/tableState";
import { DATASOURCE_ACTIVATED } from '../datasources/datasourcesConstants';

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
            return {
                ...state,
                sortColumn: action.payload.column,
                sortType: action.payload.type
            };
        }

		case DATASOURCE_ACTIVATED: {
		    if (state.columns.length >= 3) {
		        // Only continue if we don't have enough fields yet
		        return state;
		    }

		    const fieldPath: string = action.payload.datasource.labelFieldPath;

		    if (!fieldPath) {
		        // No label set for this datasource
		        return state;
            }

		    if (state.columns.indexOf(fieldPath) !== -1) {
		        // Field is already used as a column
		        return state;
		    }

		    // Automatically add the label field as a column
		    let columns = state.columns.concat([fieldPath]);

		    return {
		        ...state,
		        columns: columns
		    };
		}

        default:
            return state;
    }
}