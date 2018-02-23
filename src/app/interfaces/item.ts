import {Node} from "./node";

export interface Item {
    id: string;
    query: string;
    highlight: null;
    count: number;
    fields: {
        [key: string]: any
    };
    requestedExtraData: boolean;
    nodes: Node[];
}