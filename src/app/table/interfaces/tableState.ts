import {Column} from "./column";

export interface TableState {
    columns: Column[];
    sortColumn: Column;
    sortType: 'asc' | 'desc'
}