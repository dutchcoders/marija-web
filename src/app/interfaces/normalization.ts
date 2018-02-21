import {Node} from "./node";
import {Link} from "./link";

export interface Normalization {
    id: string;
    regex: string;
    replaceWith: string;
    affectedNodes: Node[];
    affectedLinks: Link[];
}