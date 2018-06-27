const cache: {
	[url: string]: HTMLImageElement
} = {};

export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		if (cache[url]) {
			resolve(cache[url]);
			return;
		}

		const onError = () => reject(new Error('Failed to load image: ' + url));

		const image = new Image();

		image.addEventListener('load', () => {
			resolve(image);
			cache[url] = image;
		});

		image.addEventListener('error', onError);

		image.crossOrigin = 'anonymous';

		try {
			image.src = url;
		} catch (e) {
			onError();
		}
	});
}