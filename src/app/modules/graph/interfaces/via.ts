export interface Via {
    id?: string;

    /**
     * The path of the field that will be used as a link via.
     */
    via: string;

    from: string;
    to: string;
}