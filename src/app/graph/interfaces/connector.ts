import { Field } from '../../fields/interfaces/field';

export type MatchingStrategy = 'OR' | 'AND';
export type SimilarityAlgorithm = 'levenshtein' | 'ssdeep';

export interface Connector {
	name: string;
	rules: Rule[];
	strategy: MatchingStrategy;
	icon: string;
	color: number;
}

export interface Rule {
	id: string;
	field: Field;
	similarity?: number;
	similarityAlgorithm?: SimilarityAlgorithm
}