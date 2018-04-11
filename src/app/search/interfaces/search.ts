import {Item} from "../../graph/interfaces/item";

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
    paused: boolean;
    datasources: string[];
    searchId: string;
}