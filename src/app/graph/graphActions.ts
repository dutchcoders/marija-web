import {
	FIELD_NODES_HIGHLIGHT,
	GRAPH_WORKER_OUTPUT,
	NODE_UPDATE,
	NODES_DELETE,
	NODES_DESELECT,
	NODES_HIGHLIGHT,
	NODES_SELECT,
	NODES_TOOLTIP,
	NORMALIZATION_ADD,
	NORMALIZATION_DELETE,
	SELECT_FIELD_NODES,
	SELECTION_CLEAR,
	SET_FIELD_PARENT,
	SET_FILTER_BORING_NODES,
	SET_FILTER_SECONDARY_QUERIES, SET_IMPORTANT_NODE,
	SET_IS_DRAGGING_SUB_FIELDS,
	SET_MAP_ACTIVE, SET_NOTE,
	SET_TIMELINE_GROUPING,
	TOGGLE_LABELS,
	REBUILD_GRAPH,
	VIA_ADD,
	VIA_DELETE, SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID
} from './graphConstants';
import {
	GraphWorkerOutput,
	GraphWorkerPayload
} from './helpers/graphWorkerClass';
import { Via } from './interfaces/via';
import { TimelineGrouping } from './interfaces/graphState';
import { AppState } from '../main/interfaces/appState';
import { getGraphWorkerPayload } from './helpers/getGraphWorkerPayload';
import { Node } from './interfaces/node';
import { uniqueId } from 'lodash';

export function deselectNodes(opts) {
    return {
        type: NODES_DESELECT,
        receivedAt: Date.now(),
        nodes: opts
    };
}

export function deleteNodes(nodes: Node[]) {
	return (dispatch, getState) => {
		dispatch({
			type: NODES_DELETE,
			receivedAt: Date.now(),
			payload: {
				nodes
			}
		});

		dispatch(rebuildGraph());
	};
}

export function highlightNodes(opts) {
    return {
        type: NODES_HIGHLIGHT,
        receivedAt: Date.now(),
        nodes: opts
    };
}

export function fieldNodesHighlight(fieldPath: string) {
    return {
        type: FIELD_NODES_HIGHLIGHT,
        payload: {
            fieldPath: fieldPath
        }
    }
}

export function showTooltip(nodes) {
    return {
        type: NODES_TOOLTIP,
        receivedAt: Date.now(),
        nodes: nodes
    };
}

export function clearSelection() {
    return {
        type: SELECTION_CLEAR,
        receivedAt: Date.now()
    };
}

export function nodeUpdate(node_id: number, params) {
    return {
        type: NODE_UPDATE,
        receivedAt: Date.now(),
        node_id: node_id,
        params: params
    };
}

export function setImportantNode(nodeId: number, important: boolean) {
	return {
		type: SET_IMPORTANT_NODE,
		payload: {
			nodeId,
			important
		}
	};
}

export function nodesSelect(opts) {
    return {
        type: NODES_SELECT,
        receivedAt: Date.now(),
        nodes: opts
    };
}

export function graphWorkerOutput(output: GraphWorkerOutput) {
    return {
        type: GRAPH_WORKER_OUTPUT,
		payload: {
			...output
		}
    }
}

export function toggleLabels(show: boolean) {
    return {
        type: TOGGLE_LABELS,
        payload: {
            show: show
        }
    }
}

export function selectFieldNodes(fieldPath: string) {
    return {
        type: SELECT_FIELD_NODES,
        payload: {
            fieldPath: fieldPath
        }
    }
}

export function viaAdd(via: Via) {
    return {
        type: VIA_ADD,
        receivedAt: Date.now(),
        via: via
    };
}

export function viaDelete(via) {
    return {
        type: VIA_DELETE,
        receivedAt: Date.now(),
        via: via
    };
}

export function normalizationAdd(normalization) {
    return {
        type: NORMALIZATION_ADD,
        receivedAt: Date.now(),
        normalization: normalization
    };
}

export function normalizationDelete(normalization) {
    return {
        type: NORMALIZATION_DELETE,
        receivedAt: Date.now(),
        normalization: normalization
    };
}

export function setMapActive(active: boolean) {
    return {
        type: SET_MAP_ACTIVE,
        payload: {
            active
        }
    };
}

export function setTimelineGrouping(timelineGrouping: TimelineGrouping) {
	return {
		type: SET_TIMELINE_GROUPING,
		payload: {
			timelineGrouping
		}
	};
}

export function setFilterBoringNodes(enabled: boolean) {
	return (dispatch, getState) => {
		dispatch({
			type: SET_FILTER_BORING_NODES,
			payload: {
				enabled
			}
		});

		dispatch(rebuildGraph());
	};
}

export function setFilterSecondaryQueries(enabled: boolean) {
	return (dispatch, getState) => {
		dispatch({
			type: SET_FILTER_SECONDARY_QUERIES,
			payload: {
				enabled
			}
		});

		dispatch(rebuildGraph());
	};
}

export function setIsDraggingSubFields(enabled: boolean) {
	return {
		type: SET_IS_DRAGGING_SUB_FIELDS,
		payload: {
			enabled
		}
	};
}

export function rebuildGraph() {
	return (dispatch, getState) => {
		const state: AppState = getState();

		if (state.graph.items.length === 0) {
			// Don't rebuild when there is no data
			return;
		}

		const newState: AppState = getState();
		const payload = getGraphWorkerPayload(newState);

		payload.prevNodes = [];
		payload.prevLinks = [];

		dispatch({
			type: REBUILD_GRAPH,
			meta: {
				WebWorker: true
			},
			payload: payload
		})
	};
}

export function setNote(nodeId: number, note: string) {
	return {
		type: SET_NOTE,
		payload: {
			nodeId,
			note
		}
	};
}

export function setExpectedGraphWorkerOutputId(id: string) {
	return {
		type: SET_EXPECTED_GRAPH_WORKER_OUTPUT_ID,
		payload: {
			id
		}
	};
}