import { getHeatMap } from './getHeatMap';
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
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 2
		}
	});
});

test('should compute with multiple fields', () => {
	const items = [
		getItem({ first_name: 'harry', last_name: 'kuipers' }),
		getItem({ first_name: 'harry', last_name: 'wit' }),
		getItem({ first_name: 'barry', last_name: 'kuipers' }),
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 2,
			last_name: 0
		},
		last_name: {
			first_name: 0,
			last_name: 2
		}
	});
});

test('should find cross-field similarities', () => {
	const items = [
		getItem({ first_name: 'harry', last_name: 'kuipers' }),
		getItem({ first_name: 'henk', last_name: 'harry' }),
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 0,
			last_name: 2
		},
		last_name: {
			first_name: 2,
			last_name: 0
		}
	});
});


test('derp 1', () => {
	const items = [
		getItem({ first_name: ['barry'] }),
		getItem({ first_name: ['barry'] }),
		getItem({ first_name: ['barry'] }),
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 3
		}
	});
});

test('derp 2', () => {
	const items = [
		getItem({ first_name: ['barry'], last_name: ['kuipers'] }),
		getItem({ first_name: ['barry'], last_name: ['kuipers'] }),
		getItem({ first_name: ['barry'], last_name: ['kuipers'] }),
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 3,
			last_name: 0
		},
		last_name: {
			first_name: 0,
			last_name: 3
		}
	});
});

test('derp 3', () => {
	const items = [
		getItem({ first_name: ['barry'] }),
		getItem({ first_name: ['barry'] }),
		getItem({ first_name: ['barry'] }),
		getItem({ first_name: ['henk'] }),
		getItem({ first_name: ['henk'] }),
	];

	const heatMap = getHeatMap(items);

	expect(heatMap).toEqual({
		first_name: {
			first_name: 5
		}
	});
});