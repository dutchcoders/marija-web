import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map } from 'lodash'

import { Record, Icon } from '../index'
import { highlightNodes} from '../../modules/graph/index'
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index'
import { fieldLocator, phone } from '../../helpers/index'

class TableView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null
        }
    }

    handleTableAddColumn(field) {
        const { dispatch } = this.props;
        dispatch(tableColumnAdd(field));
    }

    handleTableRemoveColumn(dispatch, field) {
        dispatch(tableColumnRemove(field));
    }

    handleCancelEditNode(node) {
        const { dispatch } = this.props;
        this.setState({editNode: null});
    }

    handleEditNode(node) {
        this.setState({editNode: node});
    }

    handleDeleteNode(node) {
        const { dispatch } = this.props;
        dispatch(deleteNodes([node.id]));
    }


    renderBody() {
        const { node, items, fields, columns, dispatch} = this.props;

        return (
            node ?
                map(node, (sub_node) => {
                    return map(items, (packet) => {
                        return map(fields || [], (value) => {
                            if (phone(fieldLocator(packet.fields, value)) !== sub_node.id)
                                return null;

                            return (
                                <Record
                                    columns={ columns }
                                    node={ sub_node }
                                    packet={ packet }
                                    onMouseOver={(nodes) => { dispatch(highlightNodes(nodes)) } }
                                    onTableAddColumn={(field) => this.handleTableAddColumn(field) }
                                    onTableRemoveColumn={(field) => this.handleTableRemoveColumn(field) }
                                />
                            );
                        });
                    });
                })
                : null

        )
    }

    renderSelected() {
        const { node } = this.props;
        const { editNode } = this.state;

        return (
            node ?
                map(node, (i_node) => {
                    if (editNode == i_node) {
                        return (
                            <li key={i_node.id}><input type="text" value={i_node.id}/>
                                <button onClick={(n) => this.handleCancelEditNode(n) }>cancel</button>
                            </li>
                        )
                    } else {
                        return (
                            <li key={i_node.id}>{i_node.id}
                                <button onClick={(n) => this.handleEditNode(n) }>edit</button>
                                <button onClick={(n) => this.handleDeleteNode(n)}>delete</button>
                            </li>
                        )
                    }
                })
                : null
        )
    }

    renderHeader() {
        const { columns, dispatch } = this.props;
        const { handleTableRemoveColumn } = this;

        return map(columns, function (value) {
            return (
                <th key={ 'header_' + value }>
                    { value }
                    <Icon onClick={(e) => handleTableRemoveColumn(dispatch, value)} name="ion-ios-trash-outline"/>
                </th>
            );
        });
    }

    render() {
        return (
            <div className="form-group">

                <table>
                    <tbody>
                    <tr>
                        <th width="25">
                        </th>
                        { this.renderHeader() }
                    </tr>
                    {this.renderBody()}
                    </tbody>
                </table>
            </div>
        )
    }
}


function select(state) {
    return {
        node: state.entries.node,
        items: state.entries.items,
        fields: state.entries.fields,
        columns: state.entries.columns
    };
}


export default connect(select)(TableView);