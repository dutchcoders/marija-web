import { Field } from '../../fields/interfaces/field';

export type MatchingStrategy = 'OR' | 'AND';

export interface Connector {
	name: string;
	fields: Field[];
	strategy: MatchingStrategy;
	icon: string;
	color: number;
}