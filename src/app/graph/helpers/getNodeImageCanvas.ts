import { Node } from '../interfaces/node';
import { loadImage } from './loadImage';

export async function getNodeImageCanvas(node: Node, sizeMultiplier: number, selected: boolean): Promise<HTMLCanvasElement> {
	const radius = node.r * sizeMultiplier;
	const canvas = document.createElement('canvas');
	const lineWidth = 3;
	const margin = 2;
	canvas.width = radius * 2 + lineWidth + margin;
	canvas.height = radius * 2 + lineWidth + margin;
	const ctx = canvas.getContext('2d');

	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2, false);
	ctx.clip();

	let image: HTMLImageElement;

	try {
		image = await loadImage(node.image);
	}
	catch (e) {
		image = await loadImage('/images/logo.png');
	}

	const diameter = radius * 2;
	let newImageWidth: number;
	let newImageHeight: number;

	if (image.width > diameter) {
		newImageWidth = diameter;
		newImageHeight = newImageWidth / image.width * image.height;
	} else if (image.height > diameter) {
		newImageHeight = diameter;
		newImageWidth = newImageHeight / image.height * image.width;
	} else {
		newImageWidth = diameter;
		newImageHeight = diameter;
	}

	const imageX = canvas.width / 2 - (newImageWidth / 2);
	const imageY = canvas.height / 2 - (newImageHeight / 2);

	ctx.drawImage(
		image,
		0, 0,
		image.width, image.height,
		imageX, imageY,
		newImageWidth, newImageHeight
	);

	if (selected) {
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = '#fac04b';
		ctx.beginPath();
		ctx.arc(radius + margin, radius + margin, radius, 0, 2 * Math.PI);
		ctx.stroke();
	}

	return canvas;
}