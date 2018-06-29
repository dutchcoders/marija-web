import { Field } from '../../fields/interfaces/field';

export type NodeMatcher = 'OR' | 'AND';

export interface NodeTemplate {
	name: string;
	fields: Field[];
	matcher: NodeMatcher;
}