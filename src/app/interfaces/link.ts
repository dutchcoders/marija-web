import {Node} from "./node";

export interface Link {
    source: string;
    target: string;
    color: string;
    total: number; // total number of links between source and target
    current: number; // current link number between source and target
    label?: string;

    /**
     * We need to keep track of which items we've used for this link, because
     * we use it to determine the thickness of the link.
     */
    itemIds: string[];

    /**
     * Per search a user can choose the amount of nodes that he wants to be
     * displayed. When the amount of available nodes exceeds this chosen amount,
     * this can cause the link to be hidden.
     */
    display: boolean;

    /**
     * When the link was created due to a normalization, we store which one it
     * was. This is helpful if we want to delete the normalization later.
     */
    normalizationId: string | null;

    /**
     * Whether this link is the parent of some other links that are normalized.
     * The id of this link would be the 'replaceWith' value of the normalization.
     */
    isNormalizationParent: boolean;

    /**
     * When the link is created because of a 'via configuration' (meaning it
     * has a label), we also need to store the id of the via configuration. This
     * is useful if we later delete the via config, because we can then rebuild
     * the original links (without labels).
     */
    viaId: string | null;

    replacedNode: Node;
}