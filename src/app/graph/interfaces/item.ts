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
}