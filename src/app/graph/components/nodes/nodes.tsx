import { differenceWith, map, sortBy } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../../../datasources/interfaces/datasource';
import { AppState } from '../../../main/interfaces/appState';
import { Search } from '../../../search/interfaces/search';
import { searchAround } from '../../../search/searchActions';
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
import { getSelectedNodes } from '../../graphSelectors';
import SelectedNode from  '../selectedNode/selectedNode';
import { FormattedMessage } from 'react-intl';

interface Props {
    dispatch: Dispatch<any>;
    searches: Search[];
    nodes: Node[];
    selectedNodes: Node[];
    links: Link[];
    datasources: Datasource[];
	onResetPosition: (nodes: Node[]) => void
}

interface State {
}

class Nodes extends React.Component<Props, State> {
    handleClearSelection() {
        const { dispatch } = this.props;
        dispatch(clearSelection());
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
        const { selectedNodes } = this.props;

	    let important;
        const notImportantNode = selectedNodes.find(node => !node.important);

        if (typeof notImportantNode !== 'undefined' || !selectedNodes.length) {
            important = (
                <button
                    type="button"
                    className="nodesButton"
                    aria-label="Mark important"
                    onClick={() => this.markImportant()}>
					<FormattedMessage id="mark_important"/>
                </button>
            );
        } else {
            important = (
                <button
                    type="button"
                    className="nodesButton"
                    aria-label="Undo important mark"
                    onClick={() => this.markNotImportant()}>
					<FormattedMessage id="undo_mark_important"/>
                </button>
            );
        }

        const searchAroundPossible = selectedNodes.length <= 10;

        return (
            <div className="form-group toolbar selectedNodesContent">
                <div className="nodesBtnGroupTop" role="group">
                    <button type="button" className="nodesButton" aria-label="Select related nodes" onClick={() => this.handleSelectRelatedNodes()}><FormattedMessage id="related"/></button>
                    <button type="button" className="nodesButton" aria-label="Select directly related nodes" onClick={() => this.handleSelectDirectlyRelatedNodes()}><FormattedMessage id="directly_related"/></button>
                    <button type="button" className="nodesButton" aria-label="Delete selected nodes" onClick={() => this.handleDeleteAllNodes()}><FormattedMessage id="delete"/></button>
                    <button type="button" className="nodesButton" aria-label="Delete but selected nodes" onClick={() => this.handleDeleteAllButSelectedNodes()}><FormattedMessage id="delete_others"/></button>
                    <button type="button" className="nodesButton" aria-label="Search around" onClick={() => this.searchAround()} disabled={!searchAroundPossible}><FormattedMessage id="search_around"/></button>
                    <button type="button" className="nodesButton" aria-label="Reset position" onClick={() => this.resetPosition()}><FormattedMessage id="reset_position"/></button>
                    {important}
                </div>
				<ul onMouseLeave={this.hideTooltip.bind(this)} className="nodesList">
					{this.renderSelected()}
				</ul>
				<div className="nodesBtnGroupBottom" role="group">
					<button type="button" className="nodesButton" aria-label="Clear selection" onClick={() => this.handleClearSelection()}><FormattedMessage id="deselect_all"/></button>
					<button type="button" className="nodesButton" aria-label="Select all nodes" onClick={() => this.handleSelectAllNodes()}><FormattedMessage id="select_all"/></button>
					<button type="button" className="nodesButton" aria-label="Select important nodes" onClick={() => this.selectImportant()}><FormattedMessage id="select_important"/></button>
				</div>
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
        datasources: state.datasources.datasources
    };
}


export default connect(select)(Nodes);
