import * as React from 'react';
import { map, mapValues, reduce, concat } from 'lodash';
import { fieldLocator } from '../../helpers/index';
import { Icon } from '../../components/index';
import Tooltip from 'rc-tooltip';

export default class Record extends React.Component<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            expanded: false
        };
    }

    handleTableAddColumn(field) {
        const { onTableAddColumn } = this.props;
        onTableAddColumn(field);
    }

    handleTableRemoveColumn(field) {
        const { onTableRemoveColumn } = this.props;
        onTableRemoveColumn(field);
    }

    handleAddField(path: string) {
        const { onAddField } = this.props;
        onAddField(path);
    }

    handleMouseOver(id) {
        /*
        const { onMouseOver } = this.props;
        onMouseOver({nodes: [id]});
        */
    }

    extractAllFields(fields, keySeed: any = false) {
        return reduce(mapValues(fields, (value, key) => {
            const keyParts = [key];
            if (keySeed) {
                keyParts.unshift(keySeed);
            }

            const useKey = keyParts.join('.');
            if (value === null ) {
               return []; 
            } else if (typeof value.map == 'function') {
                return [useKey];
            } else if (typeof value == 'object') {
                return [].concat(this.extractAllFields(value, useKey));
            } else {
                return [useKey];
            }
        }), (result, value) => {
            return concat(result, value);
        });
    }

    renderDetails(columns) {
        const { record } = this.props;
        const allFields = this.extractAllFields(record.fields, false);

        const expandedFields = map(allFields, (value: any, key) => {
            const highlight = record.highlight || {};
            let field_value = highlight[value] || fieldLocator(record.fields, value) ;

            if (typeof field_value === 'object') {
                field_value = JSON.stringify(field_value);
            }

            return (
                <tr key={ 'field_' + value }>
                    <td>{value}
                        <div className="fieldButtons">
                            <Tooltip
                                overlay="Add as column"
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                <Icon
                                    onClick={() => this.handleTableAddColumn(value)}
                                    name="ion-ios-plus"
                                />
                            </Tooltip>

                            <Tooltip
                                overlay="Add to graph"
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                <Icon
                                    onClick={() => this.handleAddField(value)}
                                    name="ion-android-share-alt"
                                />
                            </Tooltip>
                        </div>
                    </td>
                    <td colSpan={3} className="fieldValue">{field_value}</td>
                </tr>
            );
        });

        return (
            <td colSpan={columns.length + 1}>
                <div className="details">
                    <table>
                        <tbody>{ expandedFields }</tbody>
                    </table>
                </div>
            </td>
        );
    }


    render() {
        const { record, columns, node, expanded, className } = this.props;
        if (!expanded) {
            return null;
        }

        return (
            <tr className={className + ' recordDetail'}>
                { this.renderDetails(columns) }
            </tr>
        );
    }
}
