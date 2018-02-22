import React, {Component} from 'react';
import { connect} from 'react-redux';
import { isEqual } from 'lodash';
import { nodesSelect } from '../../modules/graph/index';
import { Icon } from '../../components/index';
import { deleteSearch, editSearch } from '../../modules/search/index';
import Url from "../../domain/Url";
import Tooltip from 'rc-tooltip';
import {cancelRequest} from "../../utils/actions";
import {deselectNodes} from "../../modules/graph/actions";

class Query extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editSearchValue: null
        };
    }

    handleDelete() {
        const { dispatch, search } = this.props;

        if (!search.completed) {
            dispatch(cancelRequest(search.requestId));
        }

        dispatch(deleteSearch({search: search}));
        Url.removeQueryParam('search', search.q);
    }

    handleDisplayMore() {
        const { dispatch, search } = this.props;
        const nodes = this.countNodes();
        const newNumber = search.displayNodes + 100;

        if (newNumber > Math.ceil(nodes / 100) * 100) {
            return;
        }

        dispatch(editSearch(search.q, {
            displayNodes: newNumber
        }));
    }

    handleDisplayLess() {
        const { dispatch, search } = this.props;
        const displayNodes = this.countDisplayNodes();
        let newNumber = search.displayNodes - 100;

        if (displayNodes < newNumber) {
            newNumber = Math.floor(displayNodes/ 100) * 100;
        }

        if (newNumber < 0) {
            return;
        }

        dispatch(editSearch(search.q, {
            displayNodes: newNumber
        }));
    }

    countNodes() {
        const { nodes, search } = this.props;

        return nodes.filter(node => node.queries.indexOf(search.q) !== -1).length;
    }

    countDisplayNodes() {
        const { nodes, search } = this.props;

        return nodes.filter(node => node.display && node.queries.indexOf(search.q) !== -1).length;
    }

    selectNodes() {
        const { nodes, search, dispatch, selectedNodes } = this.props;

        const nodesInQuery = nodes.filter(node => node.queries.indexOf(search.q) !== -1);

        if (nodesInQuery.length === 0) {
            return;
        }

        // If the nodes in this query are exactly the same as the current selection, we deselect instead
        if (isEqual(nodesInQuery, selectedNodes)) {
            dispatch(deselectNodes(nodesInQuery));
        } else {
            dispatch(nodesSelect(nodesInQuery));
        }
    }

    render() {
        const { search, handleEdit } = this.props;

        const displayNodes = this.countDisplayNodes();
        const nodes = this.countNodes();
        const lessClass = 'ion ion-ios-minus ' + (displayNodes <= 0 ? 'disabled' : '');
        const moreClass = 'ion ion-ios-plus ' + (displayNodes === nodes ? 'disabled' : '');
        const itemClass = 'query ' + (search.completed ? '' : 'loading');

        return (
            <div key={search.q} style={{backgroundColor: search.color}} className={itemClass}>
                {search.q}&nbsp;
                <span className="count">
                    {displayNodes}/{nodes}
                </span>

                <div className="actions">
                    <Tooltip
                        overlay="Show less"
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon
                            onClick={() => this.handleDisplayLess() }
                            name="ion-ios-minus"
                            className={lessClass}
                        />
                    </Tooltip>

                    <Tooltip
                        overlay="Show more"
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon
                            onClick={() => this.handleDisplayMore() }
                            name="ion-ios-plus"
                            className={moreClass}
                        />
                    </Tooltip>

                    <Tooltip
                        overlay="Change color"
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon onClick={() => handleEdit()} name="ion-ios-gear"/>
                    </Tooltip>

                    <Tooltip
                        overlay="Select nodes"
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon onClick={this.selectNodes.bind(this)} name="ion-ios-color-wand"/>
                    </Tooltip>

                    <Tooltip
                        overlay="Delete"
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon onClick={(e) => this.handleDelete() }
                              name="ion-ios-close"/>
                    </Tooltip>
                </div>
            </div>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        nodes: state.entries.nodes,
        selectedNodes: state.entries.nodes.filter(node => node.selected)
    };
};

export default connect(select)(Query);
