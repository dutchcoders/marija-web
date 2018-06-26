const cache: {
	[url: string]: HTMLImageElement
} = {};

export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		if (cache[url]) {
			resolve(cache[url]);
			return;
		}

		const image = new Image();

		image.addEventListener('load', () => {
			resolve(image);
			cache[url] = image;
		});

		image.addEventListener('error', () =>
			reject(new Error('Failed to load image: ' + url))
		);

		image.crossOrigin = 'anonymous';
		image.src = url;
	});
}