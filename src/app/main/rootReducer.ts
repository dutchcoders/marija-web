import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { combineReducers } from 'redux';

import contextMenuReducer from '../contextMenu/contextMenuReducer';
import datasourcesReducer from '../datasources/datasourcesReducer';
import fieldsReducer from '../fields/fieldsReducer';
import graphReducer from '../graph/graphReducer';
import statsReducer from '../stats/statsReducer';
import tableReducer from '../table/tableReducer';
import uiReducer from '../ui/uiReducer';
import exportJson from './helpers/exportJson';
import { EXPORT_DATA, IMPORT_DATA } from './mainConstants';

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