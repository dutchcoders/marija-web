export default function fieldLocator(document, field) {
    if (!field) {return undefined;}

    /*
    const field_levels = field.split('.');

    const value = field_levels.reduce((currentLevelInDocument, currentField) => {
        if (!currentLevelInDocument) {
            return null;
        }

        if (typeof currentLevelInDocument[currentField] !== 'undefined') {
            return currentLevelInDocument[currentField];
        }

        return null;
    }, document);
    */

    return (document[field]);
}
