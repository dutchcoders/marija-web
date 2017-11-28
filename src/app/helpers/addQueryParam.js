import queryString from 'query-string';

export default function addQueryParam (currentQueryString, name, value) {
    const queryParams = queryString.parse(currentQueryString);

    // Check if this name was already in the url
    if (queryParams[name]) {
        const items = queryParams[name].split(',');

        // Only add if it doesnt exist, don't add duplicates
        if (items.indexOf(value) === -1) {
            items.push(value);
        }

        queryParams[name] = items.join(',');
    } else {
        queryParams[name] = value;
    }

    return '?' + queryString.stringify(queryParams);
}