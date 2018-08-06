import { Datasource } from '../../datasources/interfaces/datasource';
import { Connector } from '../../graph/interfaces/connector';
import { Language, PaneCollection } from './uiState';

export interface Workspace {
	version: number;
	panes: PaneCollection;
	datasources: Datasource[];
	filterBoringNodes: boolean;
	filterSecondaryQueries: boolean;
	connectors: Connector[];
	experimentalFeatures: boolean;
	queryHistory: string[];
	columns: string[],
	sortColumn: string,
	sortType: 'asc' | 'desc'
	lang: Language;
}