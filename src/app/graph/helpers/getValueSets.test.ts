import { getValueSets } from './getValueSets';

test('get all value sets', () => {
	const input = {
		first_name: 'thomas',
		mentions: ['barry', 'harry']
	};

	const output = getValueSets(input);

	expect(output.length).toBe(2);
});

test('get all value sets 2', () => {
	const input = {
		first_name: ['thomas', 'bert', 'kees'],
		mentions: ['barry', 'harry', 'pieter'],
		buddies: ['piet', 'karel', 'jan']
	};

	const output = getValueSets(input);

	expect(output.length).toBe(27);
});

test('get all value sets 3', () => {
	const input = {
		first_name: 'thomas',
		mentions: ['barry', 'harry', 'henk'],
		buddies: ['piet', 'karel'],
		name: 'kees'
	};

	const output = getValueSets(input);

	expect(output.length).toBe(6);
});

test('should not include null values', () => {
	const input = {
		first_name: 'thomas',
		mentions: null
	};

	const output = getValueSets(input);

	expect(output.length).toBe(1);
});