/**
 * We post our nodes to the worker, which calculates the x, y and radius for
 * each node using the D3 library. It returns these nodes.
 */
export interface NodeFromD3 {
    x: number;
    y: number;
    r: number; // radius
    id: string;
    count: number;
    hash: number;
    searchIds: string[];
    icon: string;
    textureKey?: string;
    label: string;
}