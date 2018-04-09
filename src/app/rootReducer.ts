import { combineReducers } from 'redux';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import {EXPORT_DATA, IMPORT_DATA} from "./modules/import/constants";
import exportJson from "./helpers/exportJson";
import contextMenuReducer from './modules/contextMenu/contextMenuReducer';
import statsReducer from "./modules/stats/statsReducer";
import graphReducer from "./modules/graph/graphReducer";
import fieldsReducer from "./modules/fields/fieldsReducer";
import datasourcesReducer from "./modules/datasources/datasourcesReducer";
import utilsReducer from "./utils/utilsReducer";

const appReducer = combineReducers({
    graph: graphReducer,
    utils: utilsReducer,
    datasources: datasourcesReducer,
    fields: fieldsReducer,
    contextMenu: contextMenuReducer,
    routing: routerReducer,
    stats: statsReducer
});

export default function root(state, action) {
    if (action.type === IMPORT_DATA) {
        state = action.payload;
    } else if (action.type === EXPORT_DATA) {
        exportJson(state);
    }

    return appReducer(state, action);
}