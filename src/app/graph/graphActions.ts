import {
	CREATE_NEW_NODE_MATCHER, DATASOURCE_ICON_UPDATED,
	DELETE_FROM_NODE_MATCHER,
	FIELD_NODES_HIGHLIGHT,
	GRAPH_WORKER_OUTPUT,
	MOVE_FIELD_BETWEEN_NODE_MATCHERS,
	MOVE_FIELD_TO_NEW_NODE_MATCHER,
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
	SET_FILTER_SECONDARY_QUERIES,
	SET_IS_DRAGGING_SUB_FIELDS,
	SET_MAP_ACTIVE,
	SET_MATCHING_STRATEGY,
	SET_TIMELINE_GROUPING,
	TOGGLE_LABELS,
	TRIGGER_GRAPH_WORKER,
	VIA_ADD,
	VIA_DELETE
} from './graphConstants';
import {
	GraphWorkerOutput,
	GraphWorkerPayload
} from './helpers/graphWorkerClass';
import { Via } from './interfaces/via';
import { TimelineGrouping } from './interfaces/graphState';
import { AppState } from '../main/interfaces/appState';
import { getGraphWorkerPayload } from './helpers/getGraphWorkerPayload';
import { SEARCH_RECEIVE } from '../search/searchConstants';
import { MatchingStrategy } from './interfaces/nodeMatcher';
import { Field } from '../fields/interfaces/field';

export function deselectNodes(opts) {
    return {
        type: NODES_DESELECT,
        receivedAt: Date.now(),
        nodes: opts
    };
}

export function deleteNodes(opts) {
    return {
        type: NODES_DELETE,
        receivedAt: Date.now(),
        nodes: opts
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
        nodes: output.nodes,
        links: output.links,
        items: output.items,
        fields: output.fields,
        searches: output.searches
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
	return {
		type: SET_FILTER_BORING_NODES,
		payload: {
			enabled
		}
	};
}

export function setFilterSecondaryQueries(enabled: boolean) {
	return {
		type: SET_FILTER_SECONDARY_QUERIES,
		payload: {
			enabled
		}
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

export function setFieldParent(child: string, parent: string) {
	return (dispatch, getState) => {
		dispatch({
			type: SET_FIELD_PARENT,
			payload: {
				child,
				parent
			}
		});

		const state: AppState = getState();
		const payload = getGraphWorkerPayload(state, [], null);

		dispatch(triggerGraphWorker(payload));
	};
}

export function triggerGraphWorker(payload: GraphWorkerPayload) {
	payload.prevNodes = [];
	payload.prevLinks = [];

	return {
		type: TRIGGER_GRAPH_WORKER,
		meta: {
			WebWorker: true
		},
		payload: payload
	};
}

export function moveFieldBetweenNodeMatchers(fieldPath: string, fromNodeMatcherName: string, toNodeMatcherName: string) {
	return {
		type: MOVE_FIELD_BETWEEN_NODE_MATCHERS,
		payload: {
			fieldPath,
			fromNodeMatcherName,
			toNodeMatcherName
		}
	};
}

export function moveFieldToNewNodeMatcher(fieldPath: string, fromNodeMatcherName: string) {
	return {
		type: MOVE_FIELD_TO_NEW_NODE_MATCHER,
		payload: {
			fieldPath,
			fromNodeMatcherName
		}
	};
}

export function createNewNodeMatcher(field: Field) {
	return {
		type: CREATE_NEW_NODE_MATCHER,
		payload: {
			field
		}
	};
}

export function setMatchingStrategy(nodeMatcherName: string, matchingStrategy: MatchingStrategy) {
	return {
		type: SET_MATCHING_STRATEGY,
		payload: {
			nodeMatcherName,
			matchingStrategy
		}
	};
}

export function deleteFromNodeMatcher(nodeMatcherName: string, fieldPath: string) {
	return {
		type: DELETE_FROM_NODE_MATCHER,
		payload: {
			nodeMatcherName,
			fieldPath
		}
	};
}