/**
 * The complete redux store for the entire application.
 */
import { ContextMenuState } from '../../contextMenu/interfaces/contextMenuState';
import { DatasourcesState } from '../../datasources/interfaces/datasourcesState';
import { FieldsState } from '../../fields/interfaces/fieldsState';
import { GraphState } from '../../graph/interfaces/graphState';
import { StatsState } from '../../stats/interfaces/statsState';
import { TableState } from '../../table/interfaces/tableState';
import { UiState } from '../../ui/interfaces/uiState';
import {ConnectionState} from "../../connection/interfaces/connectionState";

export interface AppState {
    graph: GraphState;
    contextMenu: ContextMenuState;
    fields: FieldsState;
    datasources: DatasourcesState;
    stats: StatsState;
    table: TableState;
    ui: UiState;
    connection: ConnectionState;
}