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
		willRespond: (action) => action.type === 'SEARCH_REQUEST' && action.query === 'images',
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
							name: 'Thomas',
							location: '51,3',
							created2: '2018-05-30T15:07:20Z',
							profile: 'https://avatars2.githubusercontent.com/u/1392370?s=460&v=4'
						}
					},
					{
						id: '2',
						count: 1,
						fields: {
							name: 'Remco',
							location: '51,3',
							created2: '2018-06-20T15:07:20Z',
							profile: 'https://cdn-images-1.medium.com/fit/c/120/120/0*dIQhJQRSpKOSCrid.jpg'
						}
					},
					{
						id: '3',
						count: 1,
						fields: {
							name: 'Bouke',
							location: '51,3',
							created2: '2018-07-20T15:07:20Z',
							profile: 'https://media.licdn.com/dms/image/C5103AQFGu53SZi7qTA/profile-displayphoto-shrink_200_200/0?e=1534982400&v=beta&t=CEvoYDNvYJDx2dtpa3NlR52OF4GX1itOhuMEvEbxbFo'
						}
					}
				]
			}
		}
	},
	{
		willRespond: (action) => action.type === 'SEARCH_REQUEST' && action.query === 'location2',
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
							location: '5.505,-0.09',
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
							location: '37.7,122.4',
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
					},
					{
						datasourceId: 'twitter-tweets',
						path: 'profile',
						type: 'image'
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