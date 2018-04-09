/**
 * The complete redux store for the entire application.
 */
import {GraphState} from "../reducers/graphReducer";
import {FieldsState} from "../reducers/fields";
import {DatasourcesState} from "../reducers/datasources";
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