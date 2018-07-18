import { Item } from '../../graph/interfaces/item';

export interface Search {
    aroundNodeId: null|number;
    color: string;
    completed: boolean;
    displayNodes: number;
    items: Item[];
    itemsToConfirm: Item[];
    q: string;
    requestId: string;
    total: number;
    liveDatasource: string | null;
    paused: boolean;
    datasources: string[];
    searchId: string;
}