export interface Via {
    id: string;

    /**
     * The path of the field that will be used as a link label.
     */
    label: string;

    /**
     * The paths of the 2 fields that are the link endpoints (source and target).
     * Order does not matter.
     */
    endpoints: string[];
}