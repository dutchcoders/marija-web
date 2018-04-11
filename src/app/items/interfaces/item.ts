import { Node } from '../../graph/interfaces/node';

export interface Item {
    id: string;
    searchId: string;
    highlight: null;
    count: number;
    fields: {
        [key: string]: any
    };
    requestedExtraData: boolean;
    nodes: Node[];
}