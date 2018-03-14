import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import { isEqual } from 'lodash';
import { nodesSelect } from '../../modules/graph/index';
import { Icon } from '../../components/index';
import { deleteSearch, editSearch } from '../../modules/search/index';
import Url from "../../domain/Url";
import Tooltip from 'rc-tooltip';
import {cancelRequest} from "../../utils/actions";
import {deselectNodes} from "../../modules/graph/actions";
import {Search} from "../../interfaces/search";
import {Node} from "../../interfaces/node";
import {
    activateLiveDatasource, deactivateLiveDatasource, pauseSearch,
    resumeSearch
} from "../../modules/search/actions";

interface Props {
    dispatch: Dispatch<any>;
    search: Search;
    nodes: Node[];
    selectedNodes: Node[];
    handleEdit: Function;
}

interface State {
    editSearchValue: string;
}

class Query extends React.Component<Props, State> {
    state: State = {
        editSearchValue: null
    };

    handleDelete() {
        const { dispatch, search } = this.props;

        if (!search.completed) {
            dispatch(cancelRequest(search.requestId));
        }

        Url.removeQueryParam('search', search.q);
        Url.removeQueryParam('datasources', search.q);
        dispatch(deleteSearch(search));
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

    pause() {
        const { dispatch, search } = this.props;

        dispatch(pauseSearch(search));
    }

    resume() {
        const { dispatch, search } = this.props;

        dispatch(resumeSearch(search));
    }

    activateLiveDatasource() {
        const { search, dispatch } = this.props;

        dispatch(activateLiveDatasource(search.liveDatasource));
    }

    deactivateLiveDatasource() {
        const { search, dispatch } = this.props;

        dispatch(deactivateLiveDatasource(search.liveDatasource));
    }

    render() {
        const { search, handleEdit } = this.props;

        const displayNodes = this.countDisplayNodes();
        const nodes = this.countNodes();
        const lessClass = 'ion ion-ios-minus ' + (displayNodes <= 0 ? 'disabled' : '');
        const moreClass = 'ion ion-ios-plus ' + (displayNodes === nodes ? 'disabled' : '');
        const loading: boolean = !search.completed && !search.paused;
        const itemClass = 'query ' + (loading ? 'loading' : '');

        let count = null;

        if (!search.liveDatasource || !search.paused) {
            count = (
                <span className="count">
                    {displayNodes}/{nodes}
                </span>
            );
        }

        let actions = [];

        if (!search.completed && !search.paused && !search.liveDatasource) {
            actions.push(
                <Tooltip
                    key="pause"
                    overlay="Pause"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon
                        onClick={() => this.pause() }
                        name="ion-ios-pause"
                    />
                </Tooltip>
            );
        }

        if (!search.completed && search.paused && !search.liveDatasource) {
            actions.push(
                <Tooltip
                    overlay="Resume"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon
                        onClick={() => this.resume() }
                        name="ion-ios-play"
                    />
                </Tooltip>
            );
        }

        if (!search.liveDatasource || !search.paused) {
            actions.push(
                <Tooltip
                    key="less"
                    overlay="Show less"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}>
                    <Icon
                        onClick={() => this.handleDisplayLess()}
                        name="ion-ios-minus"
                        className={lessClass}
                    />
                </Tooltip>
            );

            actions.push(
                <Tooltip
                    key="more"
                    overlay="Show more"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}>
                    <Icon
                        onClick={() => this.handleDisplayMore()}
                        name="ion-ios-plus"
                        className={moreClass}
                    />
                </Tooltip>
            );

            actions.push(
                <Tooltip
                    key="color"
                    overlay="Change color"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon onClick={() => handleEdit()} name="ion-ios-gear"/>
                </Tooltip>
            );

            actions.push(
                <Tooltip
                    key="select"
                    overlay="Select nodes"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon onClick={this.selectNodes.bind(this)} name="ion-ios-color-wand"/>
                </Tooltip>
            );
        }

        if (!search.liveDatasource) {
            actions.push(
                <Tooltip
                    key="delete"
                    overlay="Delete"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon onClick={(e) => this.handleDelete() }
                          name="ion-ios-close"/>
                </Tooltip>
            );
        }

        if (search.liveDatasource && search.paused) {
            actions.push([
                <Tooltip
                    key="activate"
                    overlay="Activate"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon
                        onClick={() => this.activateLiveDatasource() }
                        name="ion-ios-play"
                    />
                </Tooltip>
            ]);
        }

        if (search.liveDatasource && !search.paused) {
            actions.push([
                <Tooltip
                    key="deactivate"
                    overlay="Deactivate"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon
                        onClick={() => this.deactivateLiveDatasource() }
                        name="ion-ios-pause"
                    />
                </Tooltip>
            ]);
        }

        return (
            <div key={search.q} style={{backgroundColor: search.color}} className={itemClass}>
                {search.q}&nbsp;
                {count}

                <div className="actions">
                    {actions}
                </div>
            </div>
        );
    }
}

const select = (state, ownProps) => {
    return ownProps;
};

export default connect(select)(Query);