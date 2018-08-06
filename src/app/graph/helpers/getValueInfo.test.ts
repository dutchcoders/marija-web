import { getValueInfo } from './getValueInfo';

test('get value info', () => {
	const nodes: any = [
		{
			childData: {
				a: ['hello'],
				b: ['bye']
			},
			type: 'item'
		},
		{
			childData: {
				a: ['hello'],
				b: ['bye2']
			},
			type: 'item'
		},
		{
			childData: {
				a: ['hello'],
				b: ['bye3']
			},
			type: 'item'
		}
	];

	const fields: any = [
		{
			path: 'a',
			type: 'text'
		},
		{
			path: 'b',
			type: 'text'
		}
	];

	const valueInfo = getValueInfo(nodes, fields);

	expect(valueInfo.length).toBe(4);

	const hello = valueInfo.filter(info => info.value === 'hello');

	expect(hello.length).toBe(1);
	expect(hello[0].occurences).toBe(3);
});

test('get value info should skip date fields', () => {
	const nodes: any = [
		{
			childData: {
				a: ['hello'],
				b: ['2018-10-10']
			},
			type: 'item'
		}
	];

	const fields: any = [
		{
			path: 'a',
			type: 'text'
		},
		{
			path: 'b',
			type: 'date'
		}
	];

	const valueInfo = getValueInfo(nodes, fields);

	expect(valueInfo.length).toBe(1);
});