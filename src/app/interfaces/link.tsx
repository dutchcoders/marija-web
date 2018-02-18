export interface Link {
    source: string;
    target: string;
    color: string;
    total: number; // total number of links between source and target
    current: number; // current link number between source and target
}