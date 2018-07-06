import { get } from 'fast-levenshtein';

export function getStringSimilarity(a: string, b: string): number {
	const distance = get(a, b);
	const fraction = 1 - distance / a.length;

	return fraction * 100;
}