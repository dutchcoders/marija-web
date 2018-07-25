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

	const valueInfo = getValueInfo(items, []);

	expect(valueInfo.length).toBe(4);

	const hello = valueInfo.filter(info => info.value === 'hello');

	expect(hello.length).toBe(1);
	expect(hello[0].occurences).toBe(3);
});