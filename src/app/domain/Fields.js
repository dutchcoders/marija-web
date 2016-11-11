import { reduce, merge } from 'lodash';

export default class Fields {

    /**
     * getTypes
     * @param mappings
     * @returns {Array|*}
     */
    static getTypes(mappings) {
        const defaultType = '_default_';

        return filter(Object.keys(mappings), (type) => {
            return type !== defaultType;
        });
    }


    /**
     * getFieldsFromResult
     * @param fields
     * @returns {*}
     */
    static getFieldsFromResult(fields) {
        return reduce(fields, (results, field) => {
            const types = Fields.getTypes(field.mappings);

            const discoveredFields = reduce(types, (perType, type) => {
                return perType.concat(Fields.recurseFields(type, field.mappings[type], ''));
            }, []);

            return results.concat(discoveredFields);
        }, []);
    }


    /**
     * recurseFields
     * @param type
     * @param fieldsContainer
     * @param base
     * @param fields
     * @returns {*|Object}
     */
    static recurseFields(type, fieldsContainer, base, fields = []) {

        let foundFields = [];

        const shouldExtract = ['properties', 'fields'].reduce((check, field) => {
            if (typeof fieldsContainer[field] === 'object') {
                return fieldsContainer[field];
            }
            return check;
        }, false);


        if (shouldExtract) {
            const field_keys = Object.keys(shouldExtract);

            foundFields = reduce(field_keys, (results, field) => {
                const innerFields = Fields.recurseFields(
                    type,
                    shouldExtract[field],
                    field,
                    []
                );

                const combinedFields = fields.concat(innerFields, results);

                combinedFields.push({
                    name: base ? [base, field].join('.') : field,
                    document_type: type,
                    type: shouldExtract[field].type,
                    format: shouldExtract[field].format || null
                });

                return combinedFields;
            }, []);
        }

        return merge(fields, foundFields);
    }


    /**
     * extractNewFields
     * @param fields
     * @param currentFields
     * @returns {*}
     */
    static extractNewFields(fields, currentFields) {
        return reduce(fields, (allFields, newItem) => {
            if (typeof currentFields.find((item) => item.name === newItem.name) == 'undefined') {
                allFields.push(newItem);
            }

            return allFields;
        }, []);
    }

}
