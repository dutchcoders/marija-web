export interface LinkFromD3 {
    source: {
        x: number;
        y: number;
    };
    target: {
        x: number;
        y: number;
    };
    label: string;
    total: number; // total number of links between nodes
    current: number; // current link number between nodes
    thickness: number;
}