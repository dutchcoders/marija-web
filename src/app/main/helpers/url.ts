import createBrowserHistory from 'history/createBrowserHistory';
import queryString from 'query-string';

const history = createBrowserHistory();
let currentLocation = history.location;

// Update our current location whenever the url changes
history.listen(location => {
    currentLocation = location;
});

export default class Url {
    static getQueries(): string[] {
        const value = Url.getParam('q');

        if (!value) {
            return [];
        }

        return value.split(',');
    }

    static addQuery(query: string) {
        const queries = Url.getQueries();

        if (queries.indexOf(query) === -1) {
            queries.push(query);
        }

        Url.setParam('q', queries.join(','));
    }

    static removeQuery(query: string) {
		let queries = Url.getQueries();

		queries = queries.filter(q => q !== query);

		Url.setParam('q', queries.join(','));
    }

    static setWorkspaceId(id: string) {
        Url.setParam('workspace', id);
    }

    static getWorkspaceId(): string {
        return Url.getParam('workspace');
    }

    private static getParam(param: string) {
		const queryParams = queryString.parse(currentLocation.search);

		return queryParams[param];
    }

    private static setParam(param: string, value: string) {
		const queryParams = queryString.parse(currentLocation.search);
		queryParams[param] = value;

		history.push(currentLocation.pathname + '?' + queryString.stringify(queryParams));
    }
}