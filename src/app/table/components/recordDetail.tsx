import { concat, forEach, isObject, map, mapValues, reduce } from 'lodash';
import Tooltip from 'rc-tooltip';
import * as React from 'react';

import fieldLocator from '../../fields/helpers/fieldLocator';
import Icon from '../../ui/components/icon';
import Expandable from './expandable/expandable';
import { connect } from 'react-redux';
import { AppState } from '../../main/interfaces/appState';
import Lightbox from '../../ui/components/lightbox/lightbox';

class RecordDetail extends React.Component<any, any> {
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

    isUrl(value: string): boolean {
        return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*$)/.test(value);
    }

    renderFieldValue(value: any, fieldPath: string) {
    	if (this.isImage(fieldPath)) {
    		return <Lightbox imageUrl={value} />
		} else if (typeof value === 'number') {
            return value;
        }
        else if (typeof value === 'string') {
            if (value.length > 200) {
                return <Expandable content={value} maxLength={200} />
            } else if (this.isUrl(value)) {
                return <a href={value} target="_blank">{value}</a>
            } else {
                return value;
            }
        } else if (typeof value === 'boolean') {
            return value ? 'yes' : 'no';
        } else if (Array.isArray(value)) {
            if (value.length === 1) {
                return this.renderFieldValue(value[0], fieldPath);
            } else {
                return (
                    <ul>
                        {value.map((element, i) =>
                            <li key={i}>{this.renderFieldValue(element, fieldPath)}</li>
                        )}
                    </ul>
                );
            }
        } else if (isObject(value)) {
            const elements = [];

            for (let key in value) {
                if (!value.hasOwnProperty(key)) {
                    continue;
                }

                elements.push(
                    <div>
                        <strong>{key}: </strong>
                        {this.renderFieldValue(value[key], fieldPath)}
                    </div>
                );
            }

            if (elements.length === 1) {
                return elements[0];
            }

            return (
                <ul>
                    {elements.map((element, i) => <li key={i}>{element}</li>)}
                </ul>
            );
        } else {
            return JSON.stringify(value);
        }
    }

    renderDetails(columns) {
        const { record, activeFields, filter } = this.props;
        const allFields = this.extractAllFields(record.fields, false);
        const isHighlighting = filter.length > 0;

        const expandedFields = map(allFields, (value: any) => {
            const highlight = record.highlight || {};
            let field_value = highlight[value] || fieldLocator(record.fields, value);

            const activeAsColumn: boolean = columns.indexOf(value) !== -1;
            let newHighlight: boolean = false;

            if (isHighlighting) {
            	newHighlight = JSON.stringify(field_value).toLowerCase().includes(filter);
			}

            return (
                <tr key={ 'field_' + value } className={newHighlight ? 'highlight' : ''}>
                    <td>{value}
                        <div className="fieldButtons">
                            <Tooltip
                                overlay={activeAsColumn ? 'Is used as column' : 'Add as column'}
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                <Icon
                                    onClick={() => this.handleTableAddColumn(value)}
                                    name={'ion-ios-plus' + (activeAsColumn ? ' disabled' : '')}
                                />
                            </Tooltip>

                            <Tooltip
                                overlay={'Create connector'}
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                <Icon
                                    onClick={() => this.handleAddField(value)}
                                    name={'ion-android-share-alt'}
                                />
                            </Tooltip>
                        </div>
                    </td>
                    <td colSpan={3} className="fieldValue">{this.renderFieldValue(field_value, value)}</td>
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

    isImage(fieldPath: string): boolean {
    	const { availableFields } = this.props;
    	const field = availableFields.find(field => field.path === fieldPath);

    	if (!field) {
    	    return false;
        }

    	return field.type === 'image';
	}

    render() {
        const { record, columns, node, expanded, className, filter } = this.props;

        if (!expanded) {
            return null;
        }

        const isHighlighting = filter.length > 0;

        return (
            <tr className={className + ' recordDetail ' + (isHighlighting ? 'isHighlighting' : '')} key={`record_detail_${record.id}`} >
                { this.renderDetails(columns) }
            </tr>
        );
    }
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	availableFields: state.fields.availableFields
});

export default connect(select)(RecordDetail);