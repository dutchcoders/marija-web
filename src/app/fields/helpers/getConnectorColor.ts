import { Connector } from '../../graph/interfaces/connector';
import { each } from 'lodash';
import { connectorColors } from '../../ui/uiConstants';

export function getConnectorColor(connectors: Connector[]): string {
	const used = {};

	connectorColors.forEach(color => used[color] = 0);
	connectors.forEach(connector => used[connector.color] ++);

	let leastUsedColor;
	let leastUsedTimes = 10;

	// Find color that's used the least amount of times
	each(used, (times, color) => {
		if (times < leastUsedTimes) {
			leastUsedTimes = times;
			leastUsedColor = color;
		}
	});

	return leastUsedColor;
}