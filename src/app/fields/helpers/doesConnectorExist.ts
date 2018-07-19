import { Connector } from '../../graph/interfaces/connector';
import { isEqual } from 'lodash';

export function doesConnectorExist(fields: string[], connectors: Connector[]): boolean {
	fields = fields.concat([]).sort();

	const found = connectors.find(connector => {
		const connectorFields = connector.rules.map(rule => rule.field.path).sort();

		return isEqual(fields, connectorFields);
	});

	return typeof found !== 'undefined';
}