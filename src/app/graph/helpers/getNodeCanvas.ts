import { Node } from '../interfaces/node';
import { Connector } from '../interfaces/connector';
import { Search } from '../../search/interfaces/search';

function getConnectorColor(connectorName: string, connectors: Connector[]) {
	const connector = connectors.find(connector => connector.name === connectorName);

	if (!connector) {
		return '#52657a';
	}

	return connector.color;
}

function getSearchColor(searchId: string, searches: Search[]) {
	const search = searches.find(search => search.searchId === searchId);

	if (typeof search !== 'undefined') {
		return search.color;
	}
}

export function getNodeCanvas(node: Node, sizeMultiplier: number, selected: boolean, searches: Search[], connectors: Connector[]): HTMLCanvasElement {
	const radius = node.r * sizeMultiplier;
	const canvas = document.createElement('canvas');
	const lineWidth = 3;
	const margin = 2;
	canvas.width = radius * 2 + lineWidth + margin;
	canvas.height = radius * 2 + lineWidth + margin;
	const ctx = canvas.getContext('2d');
	let fontSize: number;

	if (node.type === 'connector') {
		fontSize = radius;

		const color = getConnectorColor(node.connector, connectors);

		ctx.fillStyle = color;
		ctx.fillRect(margin, margin, radius * 2, radius * 2);
		ctx.fill();
	} else if (node.type === 'item') {
		fontSize = radius;
		const fractionPerSearch = 1 / node.searchIds.length;
		const anglePerSearch = 2 * Math.PI * fractionPerSearch;
		let currentAngle = .5 * Math.PI;

		node.searchIds.forEach(searchId => {
			ctx.beginPath();
			ctx.fillStyle = getSearchColor(searchId, searches);
			ctx.moveTo(radius, radius);
			ctx.arc(radius + margin, radius + margin, radius, currentAngle, currentAngle + anglePerSearch);
			ctx.fill();

			currentAngle += anglePerSearch;
		});
	}

	ctx.fillStyle = '#ffffff';
	ctx.font = fontSize + 'px Ionicons, Roboto, Helvetica, Arial';
	ctx.textAlign = 'center';
	ctx.fillText(node.icon, radius - 1 + margin, radius + margin + (fontSize / 3));

	if (node.count > 1) {
		const countFontSize = fontSize * .7;
		ctx.textAlign = 'right';
		ctx.font = countFontSize + 'px Roboto, Helvetica, Arial';
		ctx.fillText(node.count + '', radius * 1.8, radius * .2 + countFontSize);
	}

	if (selected) {
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = '#fac04b';
		ctx.beginPath();

		if (node.type === 'item') {
			ctx.arc(radius + margin, radius + margin, radius, 0, 2 * Math.PI);
			ctx.stroke();
		} else {
			ctx.strokeRect(margin, margin, radius * 2, radius * 2);
		}
	}

	return canvas;
}