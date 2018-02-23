import {Field} from "../interfaces/field";

export default function createField(existing: Field[], path: string, type: string): Field {
    const firstChar = path.charAt(0).toUpperCase();
    const fieldsWithSameChar = existing.filter(field => field.icon.indexOf(firstChar) === 0);
    let icon;

    if (fieldsWithSameChar.length === 0) {
        icon = firstChar;
    } else {
        // Append a number to the icon if multiple fields share the same
        // first character
        icon = firstChar + (fieldsWithSameChar.length + 1);
    }

    return {
        path: path,
        type: type,
        icon: icon
    };
}