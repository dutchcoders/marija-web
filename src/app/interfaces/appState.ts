/**
 * The complete redux store for the entire application.
 */
import {GraphState} from "../reducers/graphReducer";
import {FieldsState} from "../reducers/fieldsReducer";
import {DatasourcesState} from "../reducers/datasourcesReducer";
import {StatsState} from "../modules/stats/statsReducer";
import {ContextMenuState} from "../modules/contextMenu/contextMenuReducer";

export interface AppState {
    graph: GraphState;
    contextMenu: ContextMenuState;
    fields: FieldsState;
    datasources: DatasourcesState;
    stats: StatsState;
    utils: any;
}