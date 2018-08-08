import { Datasource } from '../../datasources/interfaces/datasource';
import { Connector } from '../../graph/interfaces/connector';
import { Language, PaneCollection } from './uiState';
import { Field } from '../../fields/interfaces/field';

export interface WorkspaceDescription {
	id: string;
	title: string;
	version: number;
}

export interface Workspace {
	version: number;
	panes: PaneCollection;
	datasources: Datasource[];
	filterBoringNodes: boolean;
	filterSecondaryQueries: boolean;
	connectors: Connector[];
	experimentalFeatures: boolean;
	queryHistory: string[];
	columns: string[];
	sortColumn: string;
	sortType: 'asc' | 'desc';
	lang: Language;
	automaticallyCreateConnectors: boolean;
	customDatasourceFields: Field[];
}