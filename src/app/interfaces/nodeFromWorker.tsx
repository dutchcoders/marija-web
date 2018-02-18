/**
 * We post our nodes to the worker, which calculates the x, y and radius for
 * each node using the D3 library. It returns these nodes.
 */
export interface NodeFromWorker {
    x: number;
    y: number;
    r: number; // radius
    hash: number; // use the hash to map the NodeFromWorker to the Node
}