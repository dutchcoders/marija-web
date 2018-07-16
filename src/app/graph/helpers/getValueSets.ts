interface Input {
	[key: string]: string | string[]
}

export interface ValueSet {
	[key: string]: string;
}

export function getValueSets(values: Input, relevantFields: string[]): ValueSet[] {
	const keys = Object.keys(values).filter(key =>
		relevantFields.indexOf(key) !== -1
	);

	if (keys.length === 0) {
		return [];
	}

	const output = [];

	const recurse = (prevValues, index) => {
		const key = keys[index];
		let value = values[key];

		if (!Array.isArray(value)) {
			value = [value];
		}

		value.forEach(val => {
			const newValues = {
				...prevValues
			};

			if (val !== null && val !== '') {
				newValues[key] = val + '';
			}

			if (typeof keys[index + 1] !== 'undefined') {
				recurse(newValues, index + 1);
			} else {
				output.push(newValues);
			}
		});
	};

	recurse({}, 0);

	return output;
}