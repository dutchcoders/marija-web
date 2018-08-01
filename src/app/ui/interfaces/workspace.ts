import { Datasource } from '../../datasources/interfaces/datasource';
import { Field } from '../../fields/interfaces/field';
import { Connector } from '../../graph/interfaces/connector';
import { PaneCollection } from './uiState';

export interface Workspace {
	version: number;
	panes: PaneCollection;
	datasources: Datasource[];
	filterBoringNodes: boolean;
	filterSecondaryQueries: boolean;
	connectors: Connector[];
	availableFields: Field[];
	experimentalFeatures: boolean;
	queryHistory: string[];
}