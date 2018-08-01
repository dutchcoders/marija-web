import { Field } from '../../fields/interfaces/field';

export type MatchingStrategy = 'OR' | 'AND';

export interface Connector {
	name: string;
	rules: Rule[];
	strategy: MatchingStrategy;
	icon: string;
	color: string;
	suggestionPotential?: {
		[value: string]: number
	}
}

export interface Rule {
	id: string;
	field: Field;
	similarity?: number;
	distance?: number;
}