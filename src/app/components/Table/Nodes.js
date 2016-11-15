import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, find, differenceWith } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator } from '../../helpers/index';

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
        this.refs.customDialog.show();
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

        const related_nodes = [];


        let x = (n) => {
            related_nodes.push(n);

            for (let link of links) {
                if (link.source === n.id) {
                    // check if already visited
                    if (find(related_nodes, (o) => {
                        return (link.target === o.id);
                    })) {
                        continue;
                    }

                    const target_node = find(nodes, (n2) => {
                        return (link.target == n2.id);
                    });

                    x(target_node);
                } 

                if (link.target === n.id) {
                    if (find(related_nodes, (o) => {
                        return (link.source === o.id);
                    })) {
                        continue;
                    }

                    const source_node = find(nodes, (n2) => {
                        return (link.source == n2.id);
                    });

                    x(source_node);
                } 
            }
        };

        for (let n of node) {
            x(n);
        }

        dispatch(nodesSelect(related_nodes));
    }

    handleNodeChangeName(event) {
        const { editNode, value } = this.state;
        this.setState({value: event.target.value});
    }

    handleNodeChangeDescription(event) {
        const { editNode, description } = this.state;
        this.setState({description: event.target.value});
    }

    handleDeleteAllNodes() {
        const { dispatch, node } = this.props;
        dispatch(deleteNodes(node));
    }

    renderSelected() {
        const { node } = this.props;
        const { editNode, value } = this.state;

        return (
            node ?
                map(node, (i_node) => {
                        return (
                            <li key={i_node.id}>
				<div>
                                <span>{i_node.name}</span>
                                <Icon style={{'marginRight': '60px'}}  className="glyphicon" name={ i_node.icon }></Icon>
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
                : null
        );
    }


    render() {
        const { editNode, value, description } = this.state;

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
	    <div className="form-group">
		<div className="btn-group btn-group-justified" role="group"> 
			<div className="btn-group" role="group">
			<button type="button" className="btn btn-default" aria-label="Clear selection" onClick={() => this.handleClearSelection()}>clear</button> 
			</div>
			<div className="btn-group" role="group">
			<button type="button" className="btn btn-default" aria-label="Select related nodes" onClick={() => this.handleSelectRelatedNodes()}>related</button> 
			</div>
			<div className="btn-group" role="group">
			<button type="button" className="btn btn-default" aria-label="Select all nodes" onClick={() => this.handleSelectAllNodes()}>all</button> 
			</div>
			<div className="btn-group" role="group">
			<button type="button" className="btn btn-default" aria-label="Delete selected nodes" onClick={() => this.handleDeleteAllNodes()}>delete</button> 
			</div>
			<div className="btn-group" role="group">
			<button type="button" className="btn btn-default" aria-label="Delete but selected nodes" onClick={() => this.handleDeleteAllButSelectedNodes()}>inverse delete</button> 
			</div>
		</div> 
		<div>
		    <ul>
			{this.renderSelected()}
		    </ul>
		</div>
                <SkyLight dialogStyles={updateNodeDialogStyles} hideOnOverlayClicked ref="customDialog" title="Update node" afterClose={ this.handleUpdateEditNode.bind(this) }>
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
