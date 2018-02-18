export interface Node {
    id: string;
    queries: string[];
    items: string[]; // array of item ids
    count: number;
    name: string;
    abbreviated: string; // abbreviated name
    description: string;
    icon: string;
    fields: string[];
    hash: number;
}