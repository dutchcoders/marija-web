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

    /**
     * Per search a user can choose the amount of nodes that he wants to be
     * displayed. When the amount of available nodes exceeds this chosen amount,
     * this can cause the node to be hidden.
     */
    display: boolean;

    /**
     * When the node was created due to a normalization, we store which one it
     * was. This is helpful if we want to delete the normalization later.
     */
    normalizationId: string | null;
}