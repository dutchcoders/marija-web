interface Input {
	[key: string]: string | string[]
}

interface Output {
	[key: string]: string;
}

export function getValueSets(values: Input): Output[] {
	const keys = Object.keys(values);
	const output = [];

	const recurse = (prevValues, index) => {
		const key = keys[index];
		let value = values[key];

		if (!Array.isArray(value)) {
			value = [value];
		}

		value.forEach(val => {
			val += '';

			const newValues = {
				...prevValues,
				[key]: val
			};

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