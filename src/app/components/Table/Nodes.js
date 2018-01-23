import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, filter, concat, without, find, differenceWith, sortBy } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator, getRelatedNodes } from '../../helpers/index';

import SkyLight from 'react-skylight';

class Nodes extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            value: "",
            description: ""
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

    handleUpdateEditNode(node) {
        const { editNode, value, description } = this.state;
        const { dispatch } = this.props;

        dispatch(nodeUpdate(editNode.id, {name: value, description: description }));

        this.setState({editNode: null});
    }


    handleEditNode(node) {
        this.setState({editNode: node, value: node.name});
        this.refs.editDialog.show();
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

    handleSelectAllNodes() {
        const { dispatch, node, nodes, links } = this.props;

        dispatch(nodesSelect(nodes));
    }

    handleSelectRelatedNodes() {
        const { dispatch, node, nodes, links } = this.props;

        const relatedNodes = getRelatedNodes(node, nodes, links);
        dispatch(nodesSelect(relatedNodes));
    }

    handleNodeChangeName(event) {
        this.setState({value: event.target.value});
    }

    handleNodeChangeDescription(event) {
        this.setState({description: event.target.value});
    }

    handleDeleteAllNodes() {
        const { dispatch, node } = this.props;
        dispatch(deleteNodes(node));
    }

    displayTooltip(node) {
        const { dispatch } = this.props;

        dispatch(highlightNodes([node]));
    }

    hideTooltip() {
        const { dispatch } = this.props;

        dispatch(highlightNodes([]));
    }

    renderSelected() {
        const { node } = this.props;

        return (
            node.length > 0?
                map(sortBy(node, ['name']), (i_node) => {
                        return (
                            <li key={i_node.id} onMouseEnter={() => this.displayTooltip(i_node)}>
                                <div>
                                    <span className="nodeIcon">{ i_node.icon }</span>
                                    <span>{i_node.abbreviated}</span>
                                    <Icon style={{'marginRight': '60px'}}  className="glyphicon" name={ i_node.icon[0] }></Icon>
                                    <Icon style={{'marginRight': '40px'}} onClick={(n) => this.handleEditNode(i_node)} name="ion-ios-remove-circle-outline"/>
                                    <Icon style={{'marginRight': '20px'}} onClick={(n) => this.handleDeselectNode(i_node)} name="ion-ios-remove-circle-outline"/>
                                    <Icon onClick={(n) => this.handleDeleteNode(i_node)} name="ion-ios-close-circle-outline"/>
                                </div>
                                <div>
                                    <span className='description'>{i_node.description}</span>
                                </div>
                            </li>
                        );
                })
            : <li>no node selected</li>
        );
    }

    render() {
        const { editNode, find_value, value, description } = this.state;
        const { node } = this.props;

        const updateNodeDialogStyles = {
            backgroundColor: '#fff',
            color: '#000',
            width: '400px',
            height: '400px',
            marginTop: '-200px',
            marginLeft: '-200px',
        };

        let edit_node = null;
        if (editNode) {
            edit_node = <form>
                                <Icon className="glyphicon" name={ editNode.icon }></Icon>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" className="form-control" value={value} onChange={ this.handleNodeChangeName.bind(this) } placeholder='name' />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
		                                <textarea className="form-control" value={description} onChange={ this.handleNodeChangeDescription.bind(this) } placeholder='description' />
		                            </div>
	          </form>;
	      }

        return (
            <div className="form-group toolbar">
                <div className="nodes-btn-group" role="group">
                    <button type="button" className="btn btn-default" aria-label="Clear selection" onClick={() => this.handleClearSelection()}>deselect</button>
                    <button type="button" className="btn btn-default" aria-label="Select related nodes" onClick={() => this.handleSelectRelatedNodes()}>related</button>
                    <button type="button" className="btn btn-default" aria-label="Select all nodes" onClick={() => this.handleSelectAllNodes()}>all</button>
                    <button type="button" className="btn btn-default" aria-label="Delete selected nodes" onClick={() => this.handleDeleteAllNodes()}>delete</button>
                    <button type="button" className="btn btn-default" aria-label="Delete but selected nodes" onClick={() => this.handleDeleteAllButSelectedNodes()}>delete others</button>
                </div>
                <div>
                    <ul onMouseLeave={this.hideTooltip.bind(this)}>
                        {this.renderSelected()}
                    </ul>
                </div>
                <SkyLight dialogStyles={updateNodeDialogStyles} hideOnOverlayClicked ref="editDialog" title="Update node" afterClose={ this.handleUpdateEditNode.bind(this) }>
                    { edit_node }
                </SkyLight>
            </div>
        );
    }
}


function select(state) {
    return {
        node: state.entries.node,
        highlight_nodes: state.entries.highlight_nodes,
        nodes: state.entries.nodes,
        links: state.entries.links
    };
}


export default connect(select)(Nodes);
