interface Responder {
	willRespond: Function;
	getResponse: Function;
}

export const responders: Responder[] = [
	{
		willRespond: (action) => action.type === 'SEARCH_REQUEST' && action.query === 'location',
		getResponse: (action) => {
			return {
				type: 'SEARCH_RECEIVE',
				'request-id': action['request-id'],
				datasource: 'twitter-tweets',
				query: 'location',
				results: [
					{
						id: '1',
						count: 1,
						fields: {
							name: 'yolo',
							location: '51.505,-0.09',
							created2: '2018-05-30T15:07:20Z'
						}
					},
					{
						id: '2',
						count: 1,
						fields: {
							name: 'yolo',
							location: '51,3',
							created2: '2018-06-20T15:07:20Z'
						}
					},
					{
						id: '3',
						count: 1,
						fields: {
							name: 'yolo',
							location: '51.2,2.9',
							created2: '2018-07-20T15:07:20Z'
						}
					}
				]
			}
		}
	},
	{
		willRespond: (action) => {
			console.log(action);

			return action.type === 'FIELDS_REQUEST';
		},
		getResponse: (action) => {
			return {
				type: 'FIELDS_RECEIVE',
				'request-id': action['request-id'],
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
					},
					{
						datasourceId: 'twitter-tweets',
						path: 'created2',
						type: 'date'
					}
				]
			}
		}
	}
];

export function getResponses(action) {
	const relevantResponders = responders.filter(responder => responder.willRespond(action));

	const messages = [];

	relevantResponders.forEach(responder => {
		const response = responder.getResponse(action);

		console.log('Mocking server response: ', response);

		messages.push({
			data: JSON.stringify(response)
		})
	});

	return messages;
}