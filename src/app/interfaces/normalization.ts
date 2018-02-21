import {Node} from "./node";
import {Link} from "./link";

export interface Normalization {
    regex: string;
    replaceWith: string;
    affectedNodes: Node[];
    affectedLinks: Link[];
}