export default function fieldLocator(document, field) {
    if (!field) return false;

    const field_levels = field.split('.');

    return field_levels.reduce((currentLevelInDocument, currentField) => {
        if (typeof currentLevelInDocument[currentField] !== 'undefined') {
            switch (typeof currentLevelInDocument[currentField]) {
                case 'object':
                    return JSON.stringify(currentLevelInDocument[currentField]);
                    break;
                default:
                    return currentLevelInDocument[currentField];
                    break;
            }
        }
        return false;
    }, document);
}