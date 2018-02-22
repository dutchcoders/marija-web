import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, filter, concat, without, find, differenceWith, sortBy, debounce, isEqual } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import {filterSearchResults} from "../../modules/search/actions";
import {showTooltip} from "../../modules/graph/actions";
import displayFilter from "../../helpers/displayFilter";

class Filter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            find_value: "",
            focused: false,
            opened: false
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
        const { dispatch, nodes } = this.props;
        const searchResults = this.getSearchResults();

        if (nodes.length === searchResults.length) {
            dispatch(highlightNodes([]));
        } else {
            dispatch(highlightNodes(searchResults));
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
        const { nodes } = this.props;
        const { find_value } = this.state;

        return nodes.filter((node) => node.name.toLowerCase().indexOf(find_value) !== -1);
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

    onFocus() {
        this.setState({
            focused: true
        });
    }

    onBlur() {
        setTimeout(() => {
            this.setState({
                focused: false
            });
        }, 100);
    }

    toggleOpened() {
        const { opened } = this.state;

        this.setState({
            opened: !opened
        });
    }

    getSelectedNodes() {
        const { nodes } = this.props;

        return nodes.filter(node => node.selected);
    }

    render() {
        const { find_value, focused, opened } = this.state;
        const selectedNodes = this.getSelectedNodes();

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
            return (
                <li key={node.id} onMouseEnter={() => this.displayTooltip(node)}>
                    <input type='checkbox' checked={node.selected} onChange={ (e) => this.handleFindSelectChange(node, e) } />
                    <span className="nodeIcon">{node.icon}</span>
                    { node.abbreviated }
                </li>
            );
        });

        return (
            <div className="filter">
                <div className="filterHeaderWrapper">
                    <div className={'filterHeader' + (focused ? ' focused' : '') + (opened ? ' opened' : '')}>
                        <Icon name="ion-ios-search" />
                        <input
                            type="text"
                            value={find_value}
                            onChange={ this.handleFindNodeChange.bind(this) }
                            onFocus={this.onFocus.bind(this)}
                            onBlur={this.onBlur.bind(this)}
                            placeholder="Filter nodes"
                        />
                        <Icon
                            name={opened ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down'}
                            onClick={this.toggleOpened.bind(this)}
                        />
                    </div>
                </div>

                <div className={'filterExtra' + (opened ? '' : ' hidden')}>
                    <button className="nodeSelectButton btn btn-primary" onClick={e => this.handleSelectMultiple(e, notSelectedNodes)}>Select all ({notSelectedNodes.length})</button>
                    <button className="nodeSelectButton btn btn-primary" onClick={e => this.handleDeselectMultiple(e, selectedNodesInSearch)}>Deselect all ({selectedNodesInSearch.length})</button>
                    <ul className="nodesSearchResult" onMouseLeave={this.hideTooltip.bind(this)}>
                        { find_nodes }
                    </ul>
                </div>
            </div>
        );
    }
}

function select(state) {
    return {
        nodes: state.entries.nodes.filter(node => displayFilter(node))
    };
}


export default connect(select)(Filter);
