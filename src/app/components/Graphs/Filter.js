import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, filter, concat, without, find, differenceWith, sortBy, debounce, isEqual } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import {filterSearchResults} from "../../modules/search/actions";
import {showTooltip} from "../../modules/graph/actions";

class Filter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            find_value: ""
        };
    }

    handleDeselectNode(node) {
        const { dispatch } = this.props;
        dispatch(deselectNodes([node]));
    }

    handleFindNodeChange(event) {
        this.setState({find_value: event.target.value}, () => {
            this.setFilterSearchResults();
        });
    }

    setFilterSearchResults() {
        const { dispatch, nodesForDisplay } = this.props;
        const searchResults = this.getSearchResults();

        if (nodesForDisplay.length === searchResults.length) {
            dispatch(highlightNodes([]));
        } else {
            dispatch(highlightNodes(this.getSearchResults()));
        }
    }

    handleFindSelectChange(n, event) {
        const { dispatch } = this.props;

        if (event.target.checked) {
            dispatch(nodesSelect([n]));
        } else {
            dispatch(deselectNodes([n]));
        }
    }

    displayTooltip(node) {
        const { dispatch } = this.props;

        dispatch(showTooltip([node]));
    }

    hideTooltip() {
        const { dispatch } = this.props;

        dispatch(showTooltip([]));
    }

    getSearchResults() {
        const { nodesForDisplay } = this.props;
        const { find_value } = this.state;

        return nodesForDisplay.filter((node) => node.name.toLowerCase().indexOf(find_value) !== -1);
    }

    handleSelectMultiple(e, nodes) {
        e.preventDefault();

        const { dispatch } = this.props;

        dispatch(nodesSelect(nodes));
    }

    handleDeselectMultiple(e, nodes) {
        e.preventDefault();

        const { dispatch } = this.props;

        dispatch(deselectNodes(nodes));
    }

    componentDidUpdate(prevProps) {
        const { nodesForDisplay } = this.props;

        if (!isEqual(prevProps.nodesForDisplay, nodesForDisplay)) {
            this.setFilterSearchResults();
        }
    }

    render() {
        const { find_value } = this.state;
        const { selectedNodes } = this.props;

        const searchResults = this.getSearchResults();
        const notSelectedNodes = [];
        const selectedNodesInSearch = [];

        searchResults.forEach(search => {
            const inSelection = selectedNodes.find(nodeLoop => nodeLoop.id === search.id);

            if (typeof inSelection === 'undefined') {
                notSelectedNodes.push(search);
            } else {
                selectedNodesInSearch.push(search);
            }
        });

        const find_nodes = map(searchResults, (node) => {
            const found = find(this.props.node, (n) => n.id === node.id);
            const checked = (typeof found !== 'undefined');
            return (
                <li key={node.id} onMouseEnter={() => this.displayTooltip(node)}>
                    <input type='checkbox' checked={checked}  onChange={ (e) => this.handleFindSelectChange(node, e) } />
                    <span className="nodeIcon">{node.icon}</span>
                    { node.abbreviated }
                </li>
            );
        });

        return (
            <div>
                <form>
                    <input type="text" className="form-control" value={find_value} onChange={ this.handleFindNodeChange.bind(this) } placeholder='find node' />
                    <button className="nodeSelectButton btn btn-primary" onClick={e => this.handleSelectMultiple(e, notSelectedNodes)}>Select all ({notSelectedNodes.length})</button>
                    <button className="nodeSelectButton btn btn-primary" onClick={e => this.handleDeselectMultiple(e, selectedNodesInSearch)}>Deselect all ({selectedNodesInSearch.length})</button>
                    <ul className="nodesSearchResult" onMouseLeave={this.hideTooltip.bind(this)}>
                        { find_nodes }
                    </ul>
                </form>
            </div>
        );
    }
}


function select(state) {
    return {
        selectedNodes: state.entries.selectedNodes,
        nodesForDisplay: state.entries.nodesForDisplay,
        links: state.entries.links
    };
}


export default connect(select)(Filter);
