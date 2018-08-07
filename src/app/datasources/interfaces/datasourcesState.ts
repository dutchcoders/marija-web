import {Datasource} from "./datasource";

export interface DatasourcesState {
    datasources: Datasource[];
	expectedGraphWorkerOutputId: string;
}