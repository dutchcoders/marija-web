import { TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE, ADD_INDEX, DELETE_INDEX, ADD_FIELD, DELETE_FIELD} from './index'
import { SELECT_NODE, SELECT_NODES } from '../graph/index'

export function tableColumnRemove(field) {
    return {
        type: TABLE_COLUMN_REMOVE,
        receivedAt: Date.now(),
        field: field
    }
}

export function tableColumnAdd(field) {
    return {
        type: TABLE_COLUMN_ADD,
        receivedAt: Date.now(),
        field: field
    }
}

export function addIndex(index) {
    return {
        type: ADD_INDEX,
        receivedAt: Date.now(),
        index: index
    }
}

export function deleteIndex(index) {
    return {
        type: DELETE_INDEX,
        receivedAt: Date.now(),
        index: index
    }
}

export function addField(field) {
    return {
        type: ADD_FIELD,
        receivedAt: Date.now(),
        field: field
    }
}

export function deleteField(field) {
    return {
        type: DELETE_FIELD,
        receivedAt: Date.now(),
        field: field
    }
}

export function selectNode(opts) {
    return {
        type: SELECT_NODE,
        receivedAt: Date.now(),
        ...opts
    }
}

export function selectNodes(opts) {
    return {
        type: SELECT_NODES,
        receivedAt: Date.now(),
        ...opts
    }
}