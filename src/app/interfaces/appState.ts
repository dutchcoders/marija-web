/**
 * The complete redux store for the entire application.
 */
import {EntriesState} from "../reducers/entries";
import {FieldsState} from "../reducers/fields";
import {DatasourcesState} from "../reducers/datasources";
import {StatsState} from "../modules/stats/statsReducer";
import {ContextMenuState} from "../modules/contextMenu/contextMenuReducer";

export interface AppState {
    entries: EntriesState;
    contextMenu: ContextMenuState;
    fields: FieldsState;
    datasources: DatasourcesState;
    stats: StatsState;
    utils: any;
}