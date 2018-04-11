import { FIELD_NODES_HIGHLIGHT, GRAPH_WORKER_OUTPUT, NODE_UPDATE, NODES_DELETE, NODES_DESELECT, NODES_HIGHLIGHT, NODES_SELECT, NODES_TOOLTIP, NORMALIZATION_ADD, NORMALIZATION_DELETE, SELECT_FIELD_NODES, SELECTION_CLEAR, SET_SELECTING_MODE, TOGGLE_LABELS, VIA_ADD, VIA_DELETE } from './graphConstants';
import { GraphWorkerOutput } from './helpers/graphWorkerClass';
import { Via } from './interfaces/via';

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

export function nodeUpdate(node_id: string, params) {
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

export function setSelectingMode(enable) {
    return {
        type: SET_SELECTING_MODE,
        selectingMode: enable
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