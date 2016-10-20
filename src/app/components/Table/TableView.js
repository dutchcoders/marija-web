import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map } from 'lodash'

import { Record } from '../index'
import { clearSelection } from '../../modules/graph/index'
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index'
import { fieldLocator, phone } from '../../helpers/index'

class TableView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null
        }
    }

    handleClearSelection() {
        const { dispatch } = this.props;
        dispatch(clearSelection());
    }

    handleTableAddColumn(field) {
        const { dispatch } = this.props;
        dispatch(tableColumnAdd(field));
    }

    handleTableRemoveColumn(field) {
        const { dispatch } = this.props;
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
                                    packet={packet}
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
                        return <li key={i_node.id}><input type="text" value={i_node.id}/>
                            <button onClick={(n) => this.handleCancelEditNode(n) }>cancel</button>
                        </li>;
                    } else {
                        return <li key={i_node.id}>{i_node.id}
                            <button onClick={(n) => this.handleEditNode(n) }>edit</button>
                            <button onClick={(n) => this.handleDeleteNode(n)}>delete</button>
                        </li>;
                    }
                })
                : null
        )
    }

    renderHeader() {
        const { columns } = this.props;

        return map(columns, function (value) {
            return <th key={ 'header_' + value }>{ value }
                <button onClick={() => this.handleTableRemoveColumn(value)}>remove</button>
            </th>;
        });
    }

    render() {
        return <div>
            <ul>
                {this.renderSelected()}
            </ul>

            <button onClick={() => this.handleClearSelection()}>Clear</button>
            <table className='table table-condensed table-striped col-md-4 col-lg-4'>
                <tbody>
                <tr>
                    { this.renderHeader() }
                </tr>
                {this.renderBody()}
                </tbody>
            </table>
        </div>;
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