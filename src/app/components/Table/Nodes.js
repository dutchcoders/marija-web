import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, deleteNodes, deselectNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator } from '../../helpers/index';

class Nodes extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null
        };
    }

    handleClearSelection() {
        const { dispatch } = this.props;
        dispatch(clearSelection());
    }

    handleCancelEditNode(node) {
        const { dispatch } = this.props;
        this.setState({editNode: null});
    }

    handleEditNode(node) {
        this.setState({editNode: node});
    }

    handleDeselectNode(node) {
        const { dispatch } = this.props;
        dispatch(deselectNodes([node]));
    }

    handleDeleteNode(node) {
        const { dispatch } = this.props;
        dispatch(deleteNodes([node]));
    }

    handleDeleteAllNodes() {
        const { dispatch, node } = this.props;
        dispatch(deleteNodes(node));
    }

    renderSelected() {
        const { node } = this.props;
        const { editNode } = this.state;

        return (
            node ?
                map(node, (i_node) => {
                    if (editNode == i_node) {
                        return (
                            <li key={i_node.id}>
                                <Icon className="glyphicon">{ i_node.icon }</Icon>
                                <input type="text" value={i_node.id}/>
                                <button onClick={(n) => this.handleCancelEditNode(n) }>cancel</button>
                            </li>
                        );
                    } else {
                        return (
                            <li key={i_node.id}>
                                {i_node.id}
                                <Icon style={{'marginRight': '40px'}}  className="glyphicon">{ i_node.icon }</Icon>
                                <Icon style={{'marginRight': '20px'}} onClick={(n) => this.handleDeselectNode(i_node)} name="ion-ios-remove-circle-outline"/>
                                <Icon onClick={(n) => this.handleDeleteNode(i_node)} name="ion-ios-close-circle-outline"/>
                            </li>
                        );
                    }
                })
                : null
        );
    }


    render() {
        return (
            <div className="form-group">
                <span style={{cursor: 'pointer'}} onClick={() => this.handleClearSelection()}>
                    <Icon name="ion-ios-hand-outline"/> Clear selection
                </span>
                <span style={{cursor: 'pointer'}} onClick={() => this.handleDeleteAllNodes()}>
                    <Icon name="ion-ios-hand-outline"/> Delete all nodes
                </span>
                <br/><br/>
                <ul>
                    {this.renderSelected()}
                </ul>
            </div>
        );
    }
}


function select(state) {
    return {
        node: state.entries.node
    };
}


export default connect(select)(Nodes);
