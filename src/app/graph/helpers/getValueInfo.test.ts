import { getValueInfo } from './getValueInfo';

test('get value info', () => {
	const items: any = [
		{
			fields: {
				a: 'hello',
				b: 'bye'
			}
		},
		{
			fields: {
				a: 'hello',
				b: 'bye2'
			}
		},
		{
			fields: {
				a: 'hello',
				b: 'bye3'
			}
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

	const valueInfo = getValueInfo(items, [], fields);

	expect(valueInfo.length).toBe(4);

	const hello = valueInfo.filter(info => info.value === 'hello');

	expect(hello.length).toBe(1);
	expect(hello[0].occurences).toBe(3);
});

test('get value info should skip date fields', () => {
	const items: any = [
		{
			fields: {
				a: 'hello',
				b: '2018-10-10'
			}
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

	const valueInfo = getValueInfo(items, [], fields);

	expect(valueInfo.length).toBe(1);
});