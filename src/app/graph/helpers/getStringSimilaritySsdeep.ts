import { digest, similarity } from 'ssdeep.js';

export function getStringSimilaritySsdeep(a: string, b: string): number {
	const ssdeepA = digest(a);
	const ssdeepB = digest(b);
	
	return similarity(ssdeepA, ssdeepB);
}