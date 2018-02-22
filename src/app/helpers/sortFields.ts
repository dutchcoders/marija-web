export default function sortFields(fields) {
    fields = fields.concat([]);

    // Sort alphabetically
    fields.sort((a, b) => {
        // ignore upper and lowercase
        const nameA = a.path.toUpperCase();
        const nameB = b.path.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }

        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    });

    return fields;
}