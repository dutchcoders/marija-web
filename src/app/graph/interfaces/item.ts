import { Node } from './node';

export interface Item {
    id: string;
    searchId?: string;
	datasourceId: string;
    highlight: null;
    count: number;
    fields: {
        [key: string]: any
    };
    nodes: Node[];

	/**
	 * Per search a user can choose the amount of items that he wants to be
	 * displayed. When the amount of available items exceeds this chosen amount,
	 * this can cause the item to be hidden.
	 */
	display?: boolean;
}