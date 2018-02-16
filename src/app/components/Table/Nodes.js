import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, filter, concat, without, find, differenceWith, sortBy, forEach } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator, getRelatedNodes } from '../../helpers/index';

import SkyLight from 'react-skylight';
import {searchRequest} from "../../modules/search/actions";

class Nodes extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            value: "",
            description: "",
            nodeImages: {}
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

    getQueryColor(query) {
        const { queries } = this.props;
        const search = queries.find(search => search.q === query);

        if (typeof search !== 'undefined') {
            return search.color;
        }
    }

    getImageKey(node) {
        return node.icon
            + node.queries.map(query => this.getQueryColor(query)).join('');
    }

    prepareImage(key, node) {
        const { nodeImages } = this.state;

        if (nodeImages[key]) {
            return;
        }

        const width = 20;
        const height = 20;
        const radius = width / 2;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const fractionPerQuery = 1 / node.queries.length;
        const anglePerQuery = 2 * Math.PI * fractionPerQuery;
        let currentAngle = .5 * Math.PI;

        node.queries.forEach(query => {
            ctx.beginPath();
            ctx.fillStyle = this.getQueryColor(query);
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, currentAngle, currentAngle + anglePerQuery);
            ctx.fill();

            currentAngle += anglePerQuery;
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 12px Roboto, Helvetica, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.icon, radius - 1, radius + 5);

        this.setState(prevState => ({
            nodeImages: {
                ...prevState.nodeImages,
                [key]: canvas.toDataURL()
            }
        }));
    }

    prepareImages(nodes) {
        const keys = {};

        nodes.forEach(node => {
            const key = this.getImageKey(node);

            if (typeof keys[key] === 'undefined') {
                keys[key] = node;
            }
        });

        forEach(keys, (node, key) => {
            this.prepareImage(key, node);
        });
    }

    componentWillReceiveProps(nextProps) {
        this.prepareImages(nextProps.nodes);
    }

    componentWillMount() {
        this.prepareImages(this.props.node);
    }

    renderSelected() {
        const { node } = this.props;
        const { nodeImages } = this.state;

        return (
            node.length > 0?
                map(sortBy(node, ['name']), (i_node) => {
                    const image = nodeImages[this.getImageKey(i_node)];

                    const listItem = (
                        <li key={i_node.id} onMouseEnter={() => this.displayTooltip(i_node)}>
                            <div>
                                <img className="nodeIcon" src={image} />
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

                    return listItem;
                })
            : <li>No nodes selected</li>
        );
    }

    searchAround() {
        const { dispatch, activeIndices, fields, node } = this.props;

        node.forEach(nodeLoop => {
            dispatch(searchRequest({
                query: nodeLoop.name,
                aroundNodeId: nodeLoop.id,
                from: 0,
                size: 500,
                datasources: activeIndices,
                fields: fields
            }));
        });
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
                    <button type="button" className="btn btn-default" aria-label="Search around" onClick={() => this.searchAround()}>search around</button>
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
        nodes: state.entries.nodes,
        links: state.entries.links,
        queries: state.entries.searches,
        fields: state.entries.fields,
        activeIndices: state.indices.activeIndices
    };
}


export default connect(select)(Nodes);
