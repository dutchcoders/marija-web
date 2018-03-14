import React from 'react';

import { Icon } from '../../../components/index';

const fieldTypes = {
    string: 'ion-document-text',
    integer: 'ion-ios-information',
    long: 'ion-ios-information',
    float: 'ion-ios-information',
    double: 'ion-ios-information',
    boolean: 'ion-ios-checkmark-empty',
    date: 'ion-ios-calendar-outline',
    geo_point: 'ion-navigate',
    ip: 'ion-android-laptop'
};

const unknownType = 'ion-ios-help';

/**
 * FieldType
 * @param type
 * @returns {XML}
 * @constructor
 */
export default function FieldType(props) {
    const icon = fieldTypes[props.type] || unknownType;
    return <Icon name={`${icon} type-indicator`} title={props.type} />
}
