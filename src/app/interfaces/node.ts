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
     * When the node was created due to a normalization, we store which one it
     * was. This is helpful if we want to delete the normalization later.
     */
    normalizationId: string | null;
}