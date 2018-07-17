export function detectFieldType(values: string[]): string {
	if (areNumbers(values)) {
		return 'number';
	}

	if (areDates(values)) {
		return 'date';
	}

	if (areLocations(values)) {
		return 'location';
	}

	if (areImages(values)) {
		return 'image';
	}

	return 'text';
}

function areNumbers(values: string[]): boolean {
	return allValuesMatchRegex(/^[0-9]+\.?[0-9]*$/, values);
}

function areDates(values: string[]): boolean {
	// Example: 2018-07-12T11:55:43Z
	return allValuesMatchRegex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/, values);
}

function areLocations(values: string[]): boolean {
	// Example: 51.5, 50.1
	// Example: 51, 50
	// Example: 51,50
	return allValuesMatchRegex(/^[0-9]+(\.[0-9]+)?, ?[0-9]+(\.[0-9]+)?$/, values);
}

function areImages(values: string[]): boolean {
	return allValuesMatchRegex(/^http.+\.(jpg|png|gif|jpeg)$/i, values);
}

function allValuesMatchRegex(regex: RegExp, values: string[]): boolean {
	for (let i = 0; i < values.length; i ++) {
		if (regex.test(values[i]) === false) {
			return false;
		}
	}

	return true;
}