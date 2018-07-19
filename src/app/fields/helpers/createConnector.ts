import { Field } from '../interfaces/field';
import { Connector, Rule } from '../../graph/interfaces/connector';
import { getIcon } from '../../graph/helpers/getIcon';
import { getConnectorColor } from './getConnectorColor';
import { getConnectorRuleId } from './getConnectorRuleId';

export function createConnector(prevConnectors: Connector[], name: string, fields: Field[]): Connector {
	const rules: Rule[] = fields.map(field => ({
		id: getConnectorRuleId(prevConnectors),
		field: field
	}));

	return {
		name: name,
		rules: rules,
		strategy: 'OR',
		icon: getIcon(fields[0].path, prevConnectors.map(matcher => matcher.icon)),
		color: getConnectorColor(prevConnectors)
	};
}