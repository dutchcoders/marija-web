/**
 * The complete redux store for the entire application.
 */
import {GraphState} from "../../graph/graphReducer";
import {FieldsState} from "../../fields/fieldsReducer";
import {DatasourcesState} from "../../datasources/datasourcesReducer";
import {StatsState} from "../../stats/statsReducer";
import {ContextMenuState} from "../../contextMenu/contextMenuReducer";
import {TableState} from "../../table/tableReducer";

export interface AppState {
    graph: GraphState;
    contextMenu: ContextMenuState;
    fields: FieldsState;
    datasources: DatasourcesState;
    stats: StatsState;
    table: TableState;
    ui: any;
}