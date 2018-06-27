export default function fieldLocator(document, field): string {
    if (!field || !document[field]) {
        return undefined;
    }

    if (Array.isArray(document[field])) {
		return document[field];
    }

    // Convert non-arrays to strings
	return document[field] + '';
}
