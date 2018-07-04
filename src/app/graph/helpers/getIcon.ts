export function getIcon(name: string, usedIcons: string[]): string {
	const firstChar = name.charAt(0).toUpperCase();
	const fieldsWithSameChar = usedIcons.filter(icon => icon.indexOf(firstChar) === 0);
	let icon;

	if (fieldsWithSameChar.length === 0) {
		icon = firstChar;
	} else {
		// Append a number to the icon if multiple fields share the same
		// first character
		icon = firstChar + (fieldsWithSameChar.length + 1);
	}

	return icon;
}