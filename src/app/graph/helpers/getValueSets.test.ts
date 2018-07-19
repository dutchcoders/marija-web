import { getValueSets } from './getValueSets';

test('get all value sets', () => {
	const input = {
		first_name: 'thomas',
		mentions: ['barry', 'harry']
	};

	const output = getValueSets(input, ['first_name', 'mentions']);

	expect(output.length).toBe(2);
});

test('get all value sets 2', () => {
	const input = {
		first_name: ['thomas', 'bert', 'kees'],
		mentions: ['barry', 'harry', 'pieter'],
		buddies: ['piet', 'karel', 'jan']
	};

	const output = getValueSets(input, ['first_name', 'mentions', 'buddies']);

	expect(output.length).toBe(27);
});

test('get all value sets 3', () => {
	const input = {
		first_name: 'thomas',
		mentions: ['barry', 'harry', 'henk'],
		buddies: ['piet', 'karel'],
		name: 'kees'
	};

	const output = getValueSets(input,  ['first_name', 'mentions', 'buddies', 'name']);

	expect(output.length).toBe(6);
});

test('should not include null values', () => {
	const input = {
		first_name: 'thomas',
		mentions: null
	};

	const output = getValueSets(input, ['first_name', 'mentions']);

	expect(output.length).toBe(1);
});

test('should not include empty values', () => {
	const input = {
		first_name: 'thomas',
		mentions: ''
	};

	const output = getValueSets(input, ['first_name', 'mentions']);

	expect(output.length).toBe(1);
});

test('should skip fields that are not specified as relevant', () => {
	const input = {
		first_name: 'thomas',
		mentions: 'something',
		skip_me: 'lalala'
	};

	const output = getValueSets(input, ['first_name', 'mentions']);

	expect(output.length).toBe(1);
	expect(output[0].skip_me).toBeUndefined();
});

test('should work when there are empty arrays present', () => {
	const input = {
		first_name: 'thomas',
		last_name: [],
	};

	const output = getValueSets(input, ['first_name', 'last_name']);

	expect(output.length).toBe(1);
});