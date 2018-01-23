import React, { Component } from 'react';
import {connect} from 'react-redux';

import { map, uniq, filter, concat, without, find, differenceWith, sortBy, debounce } from 'lodash';

import { Icon } from '../index';
import { clearSelection, highlightNodes, nodeUpdate, nodesSelect, deleteNodes, deselectNodes} from '../../modules/graph/index';
import { tableColumnAdd, tableColumnRemove } from '../../modules/data/index';
import { fieldLocator, getRelatedNodes } from '../../helpers/index';
import {filterSearchResults} from "../../modules/search/actions";

class Filter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            value: "",
            find_value: "",
            description: ""
        };
    }

    handleDeselectNode(node) {
        const { dispatch } = this.props;
        dispatch(deselectNodes([node]));
    }

    handleFindNodeChange(event) {
        this.setState({find_value: event.target.value});
        this.setFilterSearchResults();
    }

    setFilterSearchResults = debounce(() => {
        const { dispatch, nodesForDisplay } = this.props;
        const searchResults = this.getSearchResults();

        if (nodesForDisplay.length === searchResults.length) {
            dispatch(filterSearchResults([]));
        } else {
            dispatch(filterSearchResults(this.getSearchResults()));
        }
    }, 50);

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

        dispatch(highlightNodes([node]));
    }

    hideTooltip() {
        const { dispatch } = this.props;

        dispatch(highlightNodes([]));
    }

    renderSelected() {
        const { node } = this.props;
        const { editNode, value } = this.state;

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

    getSearchResults() {
        const { nodesForDisplay } = this.props;
        const { find_value } = this.state;

        return nodesForDisplay.filter((node) => node.name.toLowerCase().indexOf(find_value) !== -1);
    }

    handleSelectMultiple(e, nodes) {
        e.preventDefault();

        const { dispatch, node } = this.props;
        const searchResults = this.getSearchResults();

        dispatch(nodesSelect(nodes));
    }

    handleDeselectMultiple(e, nodes) {
        e.preventDefault();

        const { dispatch } = this.props;

        dispatch(deselectNodes(nodes));
    }

    render() {
        const { editNode, find_value, value, description } = this.state;
        const { node } = this.props;

        const searchResults = this.getSearchResults();
        const notSelectedNodes = [];
        const selectedNodes = [];

        searchResults.forEach(search => {
            const inSelection = node.find(nodeLoop => nodeLoop.id === search.id);

            if (typeof inSelection === 'undefined') {
                notSelectedNodes.push(search);
            } else {
                selectedNodes.push(search);
            }
        });

        const find_nodes = map(searchResults, (node) => {
            const found = find(this.props.node, (n) => n.id === node.id);
            const checked = (typeof found !== 'undefined');
            return (
                <li key={node.id}>
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
                    <button className="nodeSelectButton btn btn-primary" onClick={e => this.handleDeselectMultiple(e, selectedNodes)}>Deselect all ({selectedNodes.length})</button>
                    <ul className="nodesSearchResult">
                        { find_nodes }
                    </ul>
                </form>
            </div>
        );
    }
}


function select(state) {
    return {
        node: state.entries.node,
        highlight_nodes: state.entries.highlight_nodes,
        nodesForDisplay: state.entries.nodesForDisplay,
        links: state.entries.links
    };
}


export default connect(select)(Filter);
