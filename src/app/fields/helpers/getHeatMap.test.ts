import { getSuggestedConnectors } from './getSuggestedConnectors';
import { uniqueId } from 'lodash';

function getItem(values): any {
	return {
		id: uniqueId(),
		fields: {
			...values
		}
	};
}

test('should compute with single field', () => {
	const items = [
		getItem({ first_name: 'harry' }),
		getItem({ first_name: 'harry' }),
		getItem({ first_name: 'henk' }),
		getItem({ first_name: 'henk' }),
	];

	const suggested = getSuggestedConnectors(items, []);

	expect(suggested.length).toBe(1);
	expect(suggested[0]).toEqual({
		fields: ['first_name'],
		links: 4,
		normalizedLinks: 1,
		uniqueConnectors: 2
	});
});
//
// test('should compute with multiple fields', () => {
// 	const items = [
// 		getItem({ first_name: 'harry', last_name: 'kuipers' }),
// 		getItem({ first_name: 'harry', last_name: 'wit' }),
// 		getItem({ first_name: 'barry', last_name: 'kuipers' }),
// 	];
//
// 	const heatMap = getSuggestedConnectors(items);
//
// 	expect(heatMap).toEqual({
// 		first_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 2,
// 				normalized: 1
// 			},
// 			{
// 				targetField: 'last_name',
// 				links: 0,
// 				normalized: 0
// 			}
// 		],
// 		last_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 0,
// 				normalized: 0
// 			},
// 			{
// 				targetField: 'last_name',
// 				links: 2,
// 				normalized: 1
// 			}
// 		],
// 	});
// });
//
// test('should find cross-field similarities', () => {
// 	const items = [
// 		getItem({ first_name: 'harry', last_name: 'kuipers' }),
// 		getItem({ first_name: 'henk', last_name: 'harry' }),
// 	];
//
// 	const heatMap = getSuggestedConnectors(items);
//
// 	expect(heatMap).toEqual({
// 		first_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 0,
// 				normalized: 0
// 			},
// 			{
// 				targetField: 'last_name',
// 				links: 2,
// 				normalized: 1
// 			}
// 		],
// 		last_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 2,
// 				normalized: 1
// 			},
// 			{
// 				targetField: 'last_name',
// 				links: 0,
// 				normalized: 0
// 			}
// 		],
// 	});
// });
//
// test('heatmaps 1', () => {
// 	const items = [
// 		getItem({ first_name: ['barry'] }),
// 		getItem({ first_name: ['barry'] }),
// 		getItem({ first_name: ['barry'] }),
// 	];
//
// 	const heatMap = getSuggestedConnectors(items);
//
// 	expect(heatMap).toEqual({
// 		first_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 3,
// 				normalized: 1
// 			}
// 		]
// 	});
// });
//
// test('heatmaps 2', () => {
// 	const items = [
// 		getItem({ first_name: ['barry'] }),
// 		getItem({ first_name: ['barry'] }),
// 		getItem({ first_name: ['barry'] }),
// 		getItem({ first_name: ['henk'] }),
// 		getItem({ first_name: ['henk'] }),
// 	];
//
// 	const heatMap = getSuggestedConnectors(items);
//
// 	expect(heatMap).toEqual({
// 		first_name: [
// 			{
// 				targetField: 'first_name',
// 				links: 5,
// 				normalized: 1
// 			},
// 		],
// 	});
// });