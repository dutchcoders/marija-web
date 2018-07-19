import {Normalization} from "./normalization";
import {Item} from "./item";
import {Search} from "../../search/interfaces/search";
import {Node} from "./node";
import {Link} from "./link";
import {Via} from "./via";

export type TimelineGrouping = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface Note {
    nodeId: number;
    note: string;
}

export interface GraphState {
    normalizations: Normalization[];
    items: Item[];
    searches: Search[];
    nodes: Node[];
    links: Link[]; // relations between nodes
    deletedNodeIds: number[];
    via: Via[];
    showLabels: boolean;
    isMapActive: boolean;
    timelineGrouping: TimelineGrouping;
    graphWorkerCacheIsValid: boolean;
    filterBoringNodes: boolean;
    filterSecondaryQueries: boolean;
    isDraggingSubFields: boolean;
    importantNodeIds: number[];
    notes: Note[];
	graphWorkerLoading: boolean;
	expectedGraphWorkerOutputId: string;
	automaticallyCreateConnectors: boolean;
}