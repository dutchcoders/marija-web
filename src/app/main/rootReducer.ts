import { combineReducers } from 'redux';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import {EXPORT_DATA, IMPORT_DATA} from "../import/constants";
import exportJson from "./helpers/exportJson";
import contextMenuReducer from '../contextMenu/contextMenuReducer';
import statsReducer from "../stats/statsReducer";
import graphReducer from "../graph/graphReducer";
import fieldsReducer from "../fields/fieldsReducer";
import datasourcesReducer from "../datasources/datasourcesReducer";
import uiReducer from "../ui/uiReducer";
import tableReducer from "../table/tableReducer";

const appReducer = combineReducers({
    graph: graphReducer,
    ui: uiReducer,
    datasources: datasourcesReducer,
    fields: fieldsReducer,
    contextMenu: contextMenuReducer,
    table: tableReducer,
    routing: routerReducer,
    stats: statsReducer
});

export default function rootReducer(state, action) {
    if (action.type === IMPORT_DATA) {
        state = action.payload;
    } else if (action.type === EXPORT_DATA) {
        exportJson(state);
    }

    return appReducer(state, action);
}