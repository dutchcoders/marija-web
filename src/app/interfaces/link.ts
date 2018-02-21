export interface Link {
    source: string;
    target: string;
    color: string;
    total: number; // total number of links between source and target
    current: number; // current link number between source and target
    label?: string;

    /**
     * When the link was created due to a normalization, we store which one it
     * was. This is helpful if we want to delete the normalization later.
     */
    normalizationId: string | null;
}