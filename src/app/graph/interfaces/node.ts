export interface Node {
    id: number;
    searchIds: string[];
    items: string[]; // array of item ids
    count: number;
    name: string;
    abbreviated: string; // abbreviated name
    description: string;
    icon: string;
    fields: string[];
    hash: number;

    /**
     * Whether we're displaying a tooltip in the graph for this node.
     */
    displayTooltip: boolean;

    /**
     * Whether the user has selected this node.
     */
    selected: boolean;

    /**
     * Whether this node is highlighted, making it stand out in the graph.
     */
    highlighted: boolean;

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

    /**
     * Whether this node is the parent of some other nodes that are normalized.
     * The id of this node would be the 'replaceWith' value of the normalization.
     */
    isNormalizationParent: boolean;

    /**
     * Whether user marked this node as important.
     */
    important: boolean;

	/**
     * If a node is a geo location, it can be displayed on a map.
	 */
	isGeoLocation: boolean;

	isImage: boolean;

	childData?: ChildData;

	textureKey?: string;
	r?: number;
	x?: number;
	y?: number;
	fx?: number;
	fy?: number;
	batch?: number;

	nodeMatcher?: string;
	datasourceId?: string;

	type: 'intersection' | 'item';
}

export interface ChildData {
	[field: string]: string[]
}