import {Field} from "../../fields/interfaces/field";
import {Normalization} from "./normalization";
import {Item} from "../../items/interfaces/item";
import {Search} from "../../search/interfaces/search";
import {Node} from "./node";
import {Link} from "./link";
import {Via} from "./via";

export type TimelineGrouping = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface GraphState {
    fields: Field[];
    date_fields: Field[];
    normalizations: Normalization[];
    items: Item[];
    searches: Search[];
    nodes: Node[];
    links: Link[]; // relations between nodes
    deletedNodes: Node[];
    via: Via[];
    showLabels: boolean;
    isMapActive: boolean;
    timelineGrouping: TimelineGrouping;
}