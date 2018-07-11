import { Field } from '../interfaces/field';
import { Connector } from '../../graph/interfaces/connector';
import { getIcon } from '../../graph/helpers/getIcon';
import { getConnectorColor } from './getConnectorColor';

export function createConnector(prevConnectors: Connector[], name: string, ruleId: string, field: Field): Connector {
	return {
		name: name,
		rules: [{
			id: ruleId,
			field: field
		}],
		strategy: 'OR',
		icon: getIcon(field.path, prevConnectors.map(matcher => matcher.icon)),
		color: getConnectorColor(prevConnectors)
	};
}