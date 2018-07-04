import { Connector } from '../../graph/interfaces/connector';
import { uniqueId } from 'lodash';

export function getConnectorName(connectors: Connector[]) {
	const names: string[] = connectors.map(matcher => matcher.name);
	let newName: string = uniqueId();

	while (names.indexOf(newName) !== -1) {
		newName = uniqueId();
	}

	return newName;
}