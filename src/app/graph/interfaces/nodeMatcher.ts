import { Field } from '../../fields/interfaces/field';

export type MatchingStrategy = 'OR' | 'AND';

export interface NodeMatcher {
	name: string;
	fields: Field[];
	strategy: MatchingStrategy;
	icon: string;
}