import { Node } from '../../graph/interfaces/node';

export interface Item {
    id: string;
    searchId?: string;
	datasourceId: string;
    highlight: null;
    count: number;
    fields: {
        [key: string]: any
    };
    requestedExtraData: boolean;
    receivedExtraData: boolean;
    nodes: Node[];
}