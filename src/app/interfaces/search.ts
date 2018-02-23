import {Item} from "./item";

export interface Search {
    aroundNodeId: null|string;
    color: string;
    completed: boolean;
    displayNodes: number;
    items: Item[];
    q: string;
    requestId: string;
    total: number;
    liveDatasource: string | null;
}