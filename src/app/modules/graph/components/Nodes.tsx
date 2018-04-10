import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import { map, uniq, filter, concat, without, find, differenceWith, sortBy, forEach } from 'lodash';
import { Icon } from '../../../components/index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../index';
import SkyLight from 'react-skylight';
import {searchAround} from '../../search/actions';
import {showTooltip} from "../graphActions";
import {normalizationAdd} from "../../data/index";
import getDirectlyRelatedNodes from '../../../helpers/getDirectlyRelatedNodes';
import {normalizationDelete} from '../../data/actions';
import {Search} from "../../search/interfaces/search";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import getRelatedNodes from '../../../helpers/getRelatedNodes';
import {Datasource} from "../../datasources/interfaces/datasource";
import {AppState} from "../../../interfaces/appState";

interface Props {
    dispatch: Dispatch<any>;
    searches: Search[];
    nodes: Node[];
    links: Link[];
    normalizations: Normalization[];
    datasources: Datasource[];
}

interface State {
    editNode: Node;
    value: string;
    description: string;
    nodeImages: any;
}

class Nodes extends React.Component<Props, State> {
    refs: any;
    state: State = {
        editNode: null,
        value: "",
        description: "",
        nodeImages: {}
    };

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
        const { dispatch, nodes } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        const delete_nodes = differenceWith(nodes, selectedNodes, (n1, n2) => {
            return n1.id == n2.id;
        });

        dispatch(deleteNodes(delete_nodes));
    }

    handleSelectAllNodes() {
        const { dispatch, nodes } = this.props;

        dispatch(nodesSelect(nodes));
    }

    handleSelectRelatedNodes() {
        const { dispatch, nodes, links } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        const relatedNodes = getRelatedNodes(selectedNodes, nodes, links);
        dispatch(nodesSelect(relatedNodes));
    }

    handleSelectDirectlyRelatedNodes() {
        const { dispatch, nodes, links } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        const relatedNodes = getDirectlyRelatedNodes(selectedNodes, nodes, links);
        dispatch(nodesSelect(relatedNodes));
    }

    handleNodeChangeName(event) {
        this.setState({value: event.target.value});
    }

    handleNodeChangeDescription(event) {
        this.setState({description: event.target.value});
    }

    handleDeleteAllNodes() {
        const { dispatch, nodes } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        dispatch(deleteNodes(selectedNodes));
    }

    displayTooltip(node) {
        const { dispatch } = this.props;

        dispatch(showTooltip([node]));
    }

    hideTooltip() {
        const { dispatch } = this.props;

        dispatch(showTooltip([]));
    }

    getQueryColor(searchId: string) {
        const { searches } = this.props;
        const search = searches.find(search => search.searchId === searchId);

        if (typeof search !== 'undefined') {
            return search.color;
        }
    }

    getImageKey(node) {
        return node.icon
            + node.searchIds.map(searchId => this.getQueryColor(searchId)).join('');
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

        const fractionPerQuery = 1 / node.searchIds.length;
        const anglePerQuery = 2 * Math.PI * fractionPerQuery;
        let currentAngle = .5 * Math.PI;

        node.searchIds.forEach(searchId => {
            ctx.beginPath();
            ctx.fillStyle = this.getQueryColor(searchId);
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
        const selectedNodes = nextProps.nodes.filter(node => node.selected);

        this.prepareImages(selectedNodes);
    }

    componentWillMount() {
        const { nodes } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        this.prepareImages(selectedNodes);
    }

    renderNode(node) {
        const { nodeImages } = this.state;
        const maxNameLength = 200;
        const image = nodeImages[this.getImageKey(node)];
        let name = node.name;

        if (node.name.length > maxNameLength) {
            name = node.name.substr(0, maxNameLength) + '...';
        }

        return (
            <div className="node" key={node.id}>
                <img className="nodeIcon" src={image} />
                <span>{name}</span>
                <Icon style={{'marginRight': '60px'}}  className="glyphicon" name={ node.icon[0] } />
                <Icon style={{'marginRight': '40px'}} onClick={(n) => this.handleEditNode(node)} name="ion-ios-remove-circle-outline"/>
                <Icon style={{'marginRight': '20px'}} onClick={(n) => this.handleDeselectNode(node)} name="ion-ios-remove-circle-outline"/>
                <Icon onClick={(n) => this.handleDeleteNode(node)} name="ion-ios-close-circle-outline"/>
            </div>
        );
    }

    getMergedNodes(normalizationId) {
        const { nodes } = this.props;

        return nodes
            .filter(node => !node.isNormalizationParent && node.normalizationId === normalizationId)
            .map(node => this.renderNode(node));
    }

    undoMerge(normalizationId) {
        const { normalizations, dispatch } = this.props;

        const normalization = normalizations.find(search => search.id === normalizationId);

        dispatch(normalizationDelete(normalization));
    }

    renderSelected() {
        const { nodes } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        return (
            selectedNodes.length > 0 ?
                map(sortBy(selectedNodes, ['name']), (i_node) => {
                    let merged = null;

                    if (i_node.normalizationId !== null) {
                        merged = (
                            <div className="merged">
                                {this.getMergedNodes(i_node.normalizationId)}
                                <button
                                    className="undoMerge"
                                    onClick={() => this.undoMerge(i_node.normalizationId)}>
                                    <Icon name="ion-ios-undo"/>
                                    Undo merge
                                </button>
                            </div>
                        );
                    }

                    const listItem = (
                        <li key={i_node.id} onMouseEnter={() => this.displayTooltip(i_node)}>
                            {this.renderNode(i_node)}
                            <div>
                                <span className='description'>{i_node.description}</span>
                            </div>
                            {merged}
                        </li>
                    );

                    return listItem;
                })
            : <li>No nodes selected</li>
        );
    }

    searchAround() {
        const { dispatch, nodes, datasources } = this.props;

        const selectedNodes = nodes.filter(node => node.selected);
        const useDatasources = datasources.filter(datasource =>
            datasource.active && datasource.type !== 'live'
        );
        const datasourceIds: string[] = useDatasources.map(datasource => datasource.id);

        selectedNodes.forEach(node => {
            dispatch(searchAround(node, datasourceIds));
        });
    }

    escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    merge() {
        const { nodes, dispatch } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        const ids = selectedNodes.map(node => this.escapeRegExp(node.id));
        const regex = '^' + ids.join('$|^') + '$';
        const name = selectedNodes.map(node => node.name).join('+');

        dispatch(normalizationAdd({
            regex: regex,
            replaceWith: name
        }));
    }

    markImportant() {
        const { nodes, dispatch } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        selectedNodes.forEach(node => {
            if (node.important) {
                return;
            }

            dispatch(nodeUpdate(node.id, {
                important: true
            }));
        });
    }

    markNotImportant() {
        const { nodes, dispatch } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

        selectedNodes.forEach(node => {
            if (!node.important) {
                return;
            }

            dispatch(nodeUpdate(node.id, {
                important: false
            }));
        });
    }

    selectImportant() {
        const { nodes, dispatch } = this.props;

        const importantNodes = nodes.filter(node => node.important);

        dispatch(nodesSelect(importantNodes));
    }

    render() {
        const { editNode, value, description } = this.state;
        const { nodes } = this.props;
        const selectedNodes = nodes.filter(node => node.selected);

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

	    let important;
        const notImportantNode = selectedNodes.find(node => !node.important);

        if (typeof notImportantNode !== 'undefined' || !selectedNodes.length) {
            important = (
                <button
                    type="button"
                    className="btn btn-default"
                    aria-label="Mark important"
                    onClick={() => this.markImportant()}>
                    mark important
                </button>
            );
        } else {
            important = (
                <button
                    type="button"
                    className="btn btn-default"
                    aria-label="Undo important mark"
                    onClick={() => this.markNotImportant()}>
                    undo important mark
                </button>
            );
        }

        return (
            <div className="form-group toolbar">
                <div className="nodes-btn-group" role="group">
                    <button type="button" className="btn btn-default" aria-label="Select all nodes" onClick={() => this.handleSelectAllNodes()}>select all</button>
                    <button type="button" className="btn btn-default" aria-label="Clear selection" onClick={() => this.handleClearSelection()}>deselect</button>
                    <button type="button" className="btn btn-default" aria-label="Select related nodes" onClick={() => this.handleSelectRelatedNodes()}>related</button>
                    <button type="button" className="btn btn-default" aria-label="Select directly related nodes" onClick={() => this.handleSelectDirectlyRelatedNodes()}>directly related</button>
                    <button type="button" className="btn btn-default" aria-label="Delete selected nodes" onClick={() => this.handleDeleteAllNodes()}>delete</button>
                    <button type="button" className="btn btn-default" aria-label="Delete but selected nodes" onClick={() => this.handleDeleteAllButSelectedNodes()}>delete others</button>
                    <button type="button" className="btn btn-default" aria-label="Search around" onClick={() => this.searchAround()}>search around</button>
                    <button type="button" className="btn btn-default" aria-label="Merge" onClick={() => this.merge()}>merge</button>
                    <button type="button" className="btn btn-default" aria-label="Select all nodes" onClick={() => this.selectImportant()}>select important</button>
                    {important}
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


function select(state: AppState) {
    return {
        nodes: state.graph.nodes,
        links: state.graph.links,
        searches: state.graph.searches,
        normalizations: state.graph.normalizations,
        datasources: state.datasources.datasources
    };
}


export default connect(select)(Nodes);
