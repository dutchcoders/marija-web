import { NodeMatcher } from '../../graph/interfaces/nodeMatcher';
import { uniqueId } from 'lodash';

export function getNodeMatcherName(nodeMatchers: NodeMatcher[]) {
	const names: string[] = nodeMatchers.map(matcher => matcher.name);
	let newName: string = uniqueId();

	while (names.indexOf(newName) !== -1) {
		newName = uniqueId();
	}

	return newName;
}