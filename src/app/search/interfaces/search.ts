import { Item } from '../../graph/interfaces/item';

export interface Search {
    aroundNodeId: null|number;
    color: string;
    completed: boolean;
    displayNodes: number;
    itemsToConfirm: Item[];
    q: string;
    requestId: string;
    total: number;
    liveDatasource: string | null;
    paused: boolean;
    datasources: string[];
    searchId: string;
    error: string;
    advancedQuery?: AdvancedQuery[];
}

export interface AdvancedQuery {
    id: string;
	field: string;
	operator: '>=';
	value: string;
	selectedValue?: string;
}