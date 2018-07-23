import { Connector } from '../../graph/interfaces/connector';
import { isEqual } from 'lodash';

export function doesConnectorExist(fields: string[], connectors: Connector[]): boolean {
	fields = fields.concat([]).sort();

	const found = connectors.find(connector => {
		const connectorFields = connector.rules.map(rule => rule.field.path).sort();
		//
		// console.log(fields, connectorFields);

		return isEqual(fields, connectorFields);
	});

	const res = typeof found !== 'undefined';

	// console.log(res);

	return typeof found !== 'undefined';
}