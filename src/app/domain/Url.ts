import createBrowserHistory from 'history/createBrowserHistory';
import queryString from 'query-string';
import {Datasource} from "../interfaces/datasource";
import * as rison from 'rison';
import {isEqual} from 'lodash';

const history = createBrowserHistory();
let currentLocation = history.location;

// Update our current location whenever the url changes
history.listen(location => {
    currentLocation = location;
});

export default class Url {
    static addSearch(query: string, datasourceIds: string[]) {
        const data: any = Url.getData();
        datasourceIds = datasourceIds.concat([]).sort();

        if (Url.searchExists(query, datasourceIds, data.search)) {
            return;
        }

        const newSearch = {q: query, d: datasourceIds};
        data.search = data.search || [];
        data.search = data.search.concat([newSearch]);

        Url.setData(data);
    }

    static removeSearch(query: string, datasourceIds: string[]) {
        const data: any = Url.getData();

        if (!data.search) {
            return;
        }

        const sorted = datasourceIds.concat([]).sort();

        data.search = data.search.filter(search =>
            search.q !== query
            || !isEqual(search.d, sorted)
        );

        if (data.search.length === 0) {
            delete data.search;
        }

        Url.setData(data);
    }

    /**
     * Add a new query param to the url
     *
     * @param name
     * @param value
     */
    static addQueryParam(name, value) {
        const data: any = Url.getData();
        const current = data[name] || [];
        const existingIndex = current.findIndex(val => val === value);

        if (existingIndex !== -1) {
            return;
        }

        data[name] = current.concat([value]);

        Url.setData(data);
    }

    /**
     * Remove a query param from the url
     *
     * @param name
     * @param value
     */
    static removeQueryParam(name, value) {
        const data: any = Url.getData();
        const current = data[name] || [];
        data[name] = current.filter(val => val !== value);

        if (data[name].length === 0) {
            delete data[name];
        }

        Url.setData(data);
    }

    static removeAllQueryParams(name) {
        Url.setData('');
    }

    static getData(): any {
        const queryParams = queryString.parse(currentLocation.search);
        return queryParams.session ? rison.decode(queryParams.session) : {};
    }

    private static setData(data: any) {
        const encoded = rison.encode_uri(data);

        history.push(currentLocation.pathname + '?session=' + encoded);
    }

    private static searchExists(query: string, datasourceIds: string[], current: any[]): boolean {
        if (!current) {
            return false;
        }

        const existing = current.find(search =>
            search.q === query
            && isEqual(search.d, datasourceIds)
        );

        return typeof existing !== 'undefined';
    }
}