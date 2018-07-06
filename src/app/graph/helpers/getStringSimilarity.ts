import { get } from 'fast-levenshtein';

export function getStringSimilarity(a: string, b: string): number {
	const distance = get(a, b);
	const longestLength = Math.max(a.length, b.length);
	const fraction = 1 - distance / longestLength;

	return fraction * 100;
}