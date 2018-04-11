/**
 * The complete redux store for the entire application.
 */
import {GraphState} from "../modules/graph/graphReducer";
import {FieldsState} from "../modules/fields/fieldsReducer";
import {DatasourcesState} from "../modules/datasources/datasourcesReducer";
import {StatsState} from "../modules/stats/statsReducer";
import {ContextMenuState} from "../modules/contextMenu/contextMenuReducer";
import {TableState} from "../modules/table/tableReducer";

export interface AppState {
    graph: GraphState;
    contextMenu: ContextMenuState;
    fields: FieldsState;
    datasources: DatasourcesState;
    stats: StatsState;
    table: TableState;
    ui: any;
}