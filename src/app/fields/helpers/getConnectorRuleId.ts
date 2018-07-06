import { Connector } from '../../graph/interfaces/connector';
import { uniqueId } from 'lodash';

export function getConnectorRuleId(connectors: Connector[]) {
	const ids: string[] = [];
	connectors.forEach(connector => {
		connector.rules.forEach(rule =>
			ids.push(rule.id)
		);
	});

	let newId: string = uniqueId();

	while (ids.indexOf(newId) !== -1) {
		newId = uniqueId();
	}

	return newId;
}