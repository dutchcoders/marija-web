interface Response {
	willRespond: Function;
	type: string;
	[property: string]: any;
}

export const responses: Response[] = [
	{
		willRespond: (action) => action.type === 'SEARCH_REQUEST' && action.query === 'location',
		type: 'SEARCH_RECEIVE',
		'request-id': '1',
		datasource: 'twitter-tweets',
		query: 'location',
		results: [
			{
				id: '1',
				count: 1,
				fields: {
					name: 'yolo',
					location: '51.505,-0.09'
				}
			},
			{
				id: '2',
				count: 1,
				fields: {
					name: 'yolo',
					location: '51,3'
				}
			},
			{
				id: '3',
				count: 1,
				fields: {
					name: 'yolo',
					location: '51.2,2.9'
				}
			}
		]
	},
	{
		willRespond: (action) => action.type === 'FIELDS_REQUEST',
		type: 'FIELDS_RECEIVE',
		'request-id': '',
		datasource: 'twitter-tweets',
		fields: [
			{
				datasourceId: 'twitter-tweets',
				path: 'location',
				type: 'location'
			},
			{
				datasourceId: 'twitter-tweets',
				path: 'name',
				type: 'string'
			}
		]
	}
];

export function getResponse(action) {
	const response = responses.find(response => response.willRespond(action));

	if (!response) {
		return null;
	}

	const responseCopy = {
		...response
	};

	delete responseCopy.willRespond;

	console.log('Mocking server response: ', responseCopy);

	return {
		data: JSON.stringify(responseCopy)
	};
}