import queryString from 'query-string';

export default function removeQueryParam (currentQueryString, name, value) {
    const queryParams = queryString.parse(currentQueryString);

    // Check if this name was already in the url
    if (queryParams[name]) {
        let items = queryParams[name].split(',');

        // Remove from the array
        items = items.filter(item => item !== value);

        queryParams[name] = items.join(',');
    }

    return '?' + queryString.stringify(queryParams);
}