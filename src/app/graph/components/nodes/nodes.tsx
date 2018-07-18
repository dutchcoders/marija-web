import { concat, differenceWith, filter, find, forEach, map, sortBy, uniq, without } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import SkyLight from 'react-skylight';

import { Datasource } from '../../../datasources/interfaces/datasource';
import { AppState } from '../../../main/interfaces/appState';
import { Search } from '../../../search/interfaces/search';
import { searchAround } from '../../../search/searchActions';
import Icon from '../../../ui/components/icon';
import {
	clearSelection,
	deleteNodes,
	nodesSelect,
	nodeUpdate,
	showTooltip
} from '../../graphActions';
import getDirectlyRelatedNodes from '../../helpers/getDirectlyRelatedNodes';
import getRelatedNodes from '../../helpers/getRelatedNodes';
import { Link } from '../../interfaces/link';
import { Node } from '../../interfaces/node';
import { Normalization } from '../../interfaces/normalization';
import { getSelectedNodes } from '../../graphSelectors';
import SelectedNode from  '../selectedNode/selectedNode';

interface Props {
    dispatch: Dispatch<any>;
    searches: Search[];
    nodes: Node[];
    selectedNodes: Node[];
    links: Link[];
    normalizations: Normalization[];
    datasources: Datasource[];
	onResetPosition: (nodes: Node[]) => void
}

interface State {
    editNode: Node;
    value: string;
    description: string;
    nodeImages: any;
}

class Nodes extends React.Component<Props, State> {
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

    handleUpdateEditNode(node) {
        const { editNode, value, description } = this.state;
        const { dispatch } = this.props;

        dispatch(nodeUpdate(editNode.id, {name: value, description: description }));

        this.setState({editNode: null});
    }

    handleDeleteAllButSelectedNodes() {
        const { dispatch, nodes, selectedNodes } = this.props;

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
        const { dispatch, selectedNodes, nodes, links } = this.props;

        const relatedNodes = getRelatedNodes(selectedNodes, nodes, links);
        dispatch(nodesSelect(relatedNodes));
    }

    handleSelectDirectlyRelatedNodes() {
        const { dispatch, nodes, links, selectedNodes } = this.props;

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
        const { dispatch, selectedNodes } = this.props;

        dispatch(deleteNodes(selectedNodes));
    }

    hideTooltip() {
        const { dispatch } = this.props;

        dispatch(showTooltip([]));
    }

    renderSelected() {
        const { selectedNodes } = this.props;

        return (
            selectedNodes.length > 0 ?
                map(sortBy(selectedNodes, ['name']), (node) =>
                    <SelectedNode node={node} key={node.id} isOnlySelectedNode={selectedNodes.length === 1}/>
                )
            : <p className="noSelectedNodes">No nodes selected.</p>
        );
    }

    searchAround() {
        const { dispatch, selectedNodes } = this.props;

        selectedNodes.forEach(node => {
            dispatch(searchAround(node));
        });
    }

    resetPosition() {
		const { onResetPosition, selectedNodes } = this.props;

		onResetPosition(selectedNodes);
	}

    markImportant() {
        const { dispatch, selectedNodes } = this.props;

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
        const { dispatch, selectedNodes } = this.props;

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
        const { selectedNodes } = this.props;

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
                    className="nodesButton"
                    aria-label="Mark important"
                    onClick={() => this.markImportant()}>
                    mark important
                </button>
            );
        } else {
            important = (
                <button
                    type="button"
                    className="nodesButton"
                    aria-label="Undo important mark"
                    onClick={() => this.markNotImportant()}>
                    undo important mark
                </button>
            );
        }

        const searchAroundPossible = selectedNodes.length <= 10;

        return (
            <div className="form-group toolbar selectedNodesContent">
                <div className="nodesBtnGroupTop" role="group">
                    <button type="button" className="nodesButton" aria-label="Select related nodes" onClick={() => this.handleSelectRelatedNodes()}>related</button>
                    <button type="button" className="nodesButton" aria-label="Select directly related nodes" onClick={() => this.handleSelectDirectlyRelatedNodes()}>directly related</button>
                    <button type="button" className="nodesButton" aria-label="Delete selected nodes" onClick={() => this.handleDeleteAllNodes()}>delete</button>
                    <button type="button" className="nodesButton" aria-label="Delete but selected nodes" onClick={() => this.handleDeleteAllButSelectedNodes()}>delete others</button>
                    <button type="button" className="nodesButton" aria-label="Search around" onClick={() => this.searchAround()} disabled={!searchAroundPossible}>search around</button>
                    <button type="button" className="nodesButton" aria-label="Reset position" onClick={() => this.resetPosition()}>reset position</button>
                    {important}
                </div>
				<ul onMouseLeave={this.hideTooltip.bind(this)} className="nodesList">
					{this.renderSelected()}
				</ul>
				<div className="nodesBtnGroupBottom" role="group">
					<button type="button" className="nodesButton" aria-label="Clear selection" onClick={() => this.handleClearSelection()}>deselect all</button>
					<button type="button" className="nodesButton" aria-label="Select all nodes" onClick={() => this.handleSelectAllNodes()}>select all</button>
					<button type="button" className="nodesButton" aria-label="Select important nodes" onClick={() => this.selectImportant()}>select important</button>
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
        selectedNodes: getSelectedNodes(state),
        links: state.graph.links,
        searches: state.graph.searches,
        normalizations: state.graph.normalizations,
        datasources: state.datasources.datasources
    };
}


export default connect(select)(Nodes);
