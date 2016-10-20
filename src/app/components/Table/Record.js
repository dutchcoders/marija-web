import React, { Component } from 'react';
import { map } from 'lodash';
import { fieldLocator } from '../../helpers/index';
import { highlightNodes } from '../../modules/graph/index'

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

    renderExpandedRecord() {
        const { packet } = this.props;

        const expandedFields = map(packet.fields, (value, key) => {
            return (
                <tr key={ 'field_' + key }>
                    <th>{ key}
                        <button onClick={() => this.handleTableAddColumn(key)}>add</button>
                    </th>
                    <td colSpan="3">{ value }</td>
                </tr>
            );
        });

        return [
            <tr>
                <td colSpan="3">
                    <table>
                        <tbody>{ expandedFields }</tbody>
                    </table>
                </td>
            </tr>,
            <tr className="json">
                <td colSpan="3">
                    { JSON.stringify(packet.fields) }
                </td>
            </tr>
        ];
    }


    render() {
        const { packet, columns, node } = this.props;
        const { expanded } = this.state;


        const renderedColumns = (columns || []).map((value) => {
            return (
                <td key={ 'column_' + packet.id + value }>
                    { fieldLocator(packet.fields, value) }
                </td>
            );
        });

        return (
            <tr>
                <td>
                    <table>
                        <tbody>
                        <tr onMouseOver={() => this.handleMouseOver(node.id) } className="columns">
                            <td>
                                <button onClick={() => this.toggleExpand(node.id) }>expand</button>
                            </td>
                            { renderedColumns }
                        </tr>
                        { expanded ? this.renderExpandedRecord() : null}
                        </tbody>
                    </table>
                </td>
            </tr>
        )
    }
}