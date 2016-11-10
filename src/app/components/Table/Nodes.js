import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, find, differenceWith } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
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

    handleDeleteAllButSelectedNodes() {
        const { dispatch, node, nodes } = this.props;

        const delete_nodes = differenceWith(nodes, node, (n1, n2) => {
            return n1.id == n2.id;
        });

        dispatch(deleteNodes(delete_nodes));
    }

    handleSelectRelatedNodes() {
        const { dispatch, node, nodes, links } = this.props;

        const related_nodes = [];

        // find all nodes recursively through links
        for (let n of node) {
            for (let link of links) {
                if (link.source === n.id) {
                    related_nodes.push(find(nodes, (n2) => {
                        return (link.target == n2.id);
                    }));
                } 

                if (link.target === n.id) {
                    related_nodes.push(find(nodes, (n2) => {
                        return (link.source == n2.id);
                    }));
                } 
            }
        }

        // todo(nl5887): uniq is cheap...
        dispatch(nodesSelect(uniq(related_nodes)));
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
                <span style={{cursor: 'pointer'}} onClick={() => this.handleDeleteAllButSelectedNodes()}>
                    <Icon name="ion-ios-hand-outline"/> Delete all but selected nodes
                </span>
                <span style={{cursor: 'pointer'}} onClick={() => this.handleSelectRelatedNodes()}>
                    <Icon name="ion-ios-hand-outline"/> Selected related nodes
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
        node: state.entries.node,
        nodes: state.entries.nodes,
        links: state.entries.links
    };
}


export default connect(select)(Nodes);
