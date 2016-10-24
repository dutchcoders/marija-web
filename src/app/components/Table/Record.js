import React, { Component } from 'react';
import { map } from 'lodash';
import { fieldLocator } from '../../helpers/index';
import { highlightNodes } from '../../modules/graph/index';
import { Icon } from '../../components/index';

export default class Record extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            expanded: false
        }
    }

    handleTableAddColumn(field) {
        const { onTableAddColumn } = this.props;
        onTableAddColumn(field);
    }

    handleTableRemoveColumn(field) {
        const { onTableRemoveColumn } = this.props;
        onTableRemoveColumn(field);
    }

    handleMouseOver(id) {
        const { onMouseOver } = this.props;
        onMouseOver({nodes: [id]});
    }

    toggleExpand(id) {
        this.setState({expanded: !this.state.expanded});
    }

    renderExpandedRecord(columns) {
        const { packet } = this.props;

        const expandedFields = map(packet.fields, (value, key) => {
            return (
                <tr key={ 'field_' + key }>
                    <td width="110">{ key}
                        <Icon onClick={() => this.handleTableAddColumn(key)}
                              name="ion-ios-add-circle"
                              style={{marginLeft: '8px', lineHeight: '20px', fontSize: '12px'}}/>
                    </td>
                    <td colSpan="3">{ value }</td>
                </tr>
            );
        });

        return (
            <td colSpan={columns.length ? columns.length : 1 }>
                <table>
                    <tbody>{ expandedFields }</tbody>
                </table>
            </td>
        )
    }


    render() {
        const { packet, columns, node } = this.props;
        const { expanded } = this.state;


        const renderedColumns = (columns || []).map((value) => {
            return (
                <td key={ 'column_' + packet.id + value }>
                    <span className={'length-limiter'}
                          title={ fieldLocator(packet.fields, value) }>{ fieldLocator(packet.fields, value) }</span>
                </td>
            )
        });

        return (
            <tr onMouseOver={() => this.handleMouseOver(node.id) }
                className={`columns ${expanded ? 'expanded' : 'closed'}`}>
                <td width="25" style={{'textAlign': 'center'}}>
                    <Icon onClick={() => this.toggleExpand(node.id) }
                          name={expanded ? 'ion-ios-remove' : 'ion-ios-add'}/>
                </td>
                { expanded ? this.renderExpandedRecord(columns) : renderedColumns}
            </tr>
        )
    }
}