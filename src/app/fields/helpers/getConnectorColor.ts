import { Connector } from '../../graph/interfaces/connector';
import { each } from 'lodash';

const colors = [
	0x499DF2,
	0x49D6F2,
	0x00CCAA,
	0x6b8fb3,
	0x3990b0,
];

export function getConnectorColor(connectors: Connector[]): number {
	const used = {};

	colors.forEach(color => used[color] = 0);
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