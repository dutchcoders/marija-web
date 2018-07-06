import { Field } from '../../fields/interfaces/field';

export type MatchingStrategy = 'OR' | 'AND';

export interface Connector {
	name: string;
	rules: ConnectorRule[];
	strategy: MatchingStrategy;
	icon: string;
	color: number;
}

export interface ConnectorRule {
	id: string;
	field: Field;
	similarity?: number;
}