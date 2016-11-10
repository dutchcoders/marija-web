import React, { Component } from 'react';
import {connect} from 'react-redux';

import { forEach, uniqWith, reduce, findIndex, pull, concat, map } from 'lodash';

import { Record, RecordDetail, Icon } from '../index';
import { highlightNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator, normalize } from '../../helpers/index';

class TableView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            items: [],
            expandedItems: [],
        };
    }

    toggleExpand(id) {
        if (findIndex(this.state.expandedItems, (o) => { return (o == id); }) >= 0) {
            // remove 
            this.setState({expandedItems: pull(this.state.expandedItems, id)});
        } else {
            // add
            this.setState({expandedItems: concat(this.state.expandedItems, id)});
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

    componentWillReceiveProps(nextProps) {
        const { selectedNodes, items, fields, columns, dispatch, normalizations } = this.props;
        let selectedItems = reduce(selectedNodes, (result, node) => {
            for (var record of items) {
                for (var field of fields) {
                    const value = fieldLocator(record.fields, field.path);
                    const normalizedValue = normalize(normalizations, value);

                    if (node.id !== normalizedValue) {
                        continue;
                    }

                    result.push(record);
                }
            }

            return result;
        }, []);

        this.setState({items: uniqWith(selectedItems, (value, other) => {
            return (value.id == other.id);
        })});
    }

    renderBody() {
        const { columns, dispatch} = this.props;
        const { items } = this.state;

        return map(items, (record) => {
                const expanded = (findIndex(this.state.expandedItems, function(o) { return o == record.id; }) >= 0);
                return [
                    <Record
                        columns={ columns }
                        record={ record }
                        toggleExpand = { this.toggleExpand.bind(this) }
                        expanded = { expanded }
                    />,
                    <RecordDetail
                        columns={ columns }
                        record={ record }
                        onTableAddColumn={(field) => this.handleTableAddColumn(field) }
                        onTableRemoveColumn={(field) => this.handleTableRemoveColumn(field) }
                        expanded = { expanded }
                    />
                ];
        });
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
        );
    }
}


function select(state) {
    return {
        selectedNodes: state.entries.node,
        normalizations: state.entries.normalizations,
        items: state.entries.items,
        fields: state.entries.fields,
        columns: state.entries.columns
    };
}


export default connect(select)(TableView);
