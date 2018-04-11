import { isEqual } from 'lodash';
import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { cancelRequest } from '../../connection/connectionActions';
import { deleteNodes, deselectNodes, nodesSelect } from '../../graph/graphActions';
import { Node } from '../../graph/interfaces/node';
import Url from '../../main/helpers/Url';
import Icon from '../../ui/components/Icon';
import { deleteSearch, editSearch } from '../index';
import { Search } from '../interfaces/search';
import { activateLiveDatasource, deactivateLiveDatasource, pauseSearch, resumeSearch } from '../searchActions';

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

        Url.removeSearch(search.q, search.datasources);
        Url.removeQueryParam('datasources', search.q);
        dispatch(deleteSearch(search));
    }

    handleDeleteNodes() {
        const { dispatch, search, nodes } = this.props;

        const queryNodes: Node[] = nodes.filter(node => node.searchIds.indexOf(search.searchId) !== -1);

        dispatch(deleteNodes(queryNodes));
    }

    handleDisplayMore() {
        const { dispatch, search } = this.props;
        const nodes = this.countNodes();
        const newNumber = search.displayNodes + 100;

        if (newNumber > Math.ceil(nodes / 100) * 100) {
            return;
        }

        dispatch(editSearch(search.searchId, {
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

        dispatch(editSearch(search.searchId, {
            displayNodes: newNumber
        }));
    }

    countNodes() {
        const { nodes, search } = this.props;

        return nodes.filter(node => node.searchIds.indexOf(search.searchId) !== -1).length;
    }

    countDisplayNodes() {
        const { nodes, search } = this.props;

        return nodes.filter(node => node.display && node.searchIds.indexOf(search.searchId) !== -1).length;
    }

    selectNodes() {
        const { nodes, search, dispatch, selectedNodes } = this.props;

        const nodesInQuery = nodes.filter(node => node.searchIds.indexOf(search.searchId) !== -1);

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

        Url.addQueryParam('live', search.liveDatasource);
        dispatch(activateLiveDatasource(search.liveDatasource));
    }

    deactivateLiveDatasource() {
        const { search, dispatch } = this.props;

        Url.removeQueryParam('live', search.liveDatasource);
        dispatch(deactivateLiveDatasource(search.liveDatasource));
    }

    render() {
        const { search, handleEdit } = this.props;

        const displayNodes: number = this.countDisplayNodes();
        const nodes: number = this.countNodes();
        const lessClass = 'ion ion-ios-minus ' + (displayNodes <= 0 ? 'disabled' : '');
        const moreClass = 'ion ion-ios-plus ' + (displayNodes === nodes ? 'disabled' : '');
        const loading: boolean = !search.completed && !search.paused;

        let count = null;

        if (!search.liveDatasource || !search.paused) {
            count = (
                <span className="count">
                    {displayNodes}/{nodes}
                </span>
            );
        }

        let actions = [];

        if (!search.liveDatasource) {
            actions.push(
                <Tooltip
                    key="datasources"
                    overlay={search.datasources.join(', ')}
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon
                        name="ion-cube"
                    />
                </Tooltip>
            );
        }

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
                    key="resume"
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

        if (!search.liveDatasource || !search.paused || nodes > 0) {
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

        if (search.liveDatasource && nodes > 0) {
            actions.push(
                <Tooltip
                    key="delete"
                    overlay="Delete nodes"
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon onClick={(e) => this.handleDeleteNodes() }
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

        let animation = null;

        if (loading) {
            animation = <div className="queryAnimation" />;
        }

        return (
            <div key={search.searchId} style={{backgroundColor: search.color}} className="query">
                {animation}
                <div className="queryInner" style={{backgroundColor: search.color}}>
                    {search.q}&nbsp;
                    {count}

                    <div className="actions">
                        {actions}
                    </div>
                </div>
            </div>
        );
    }
}

const select = (state, ownProps) => {
    return ownProps;
};

export default connect(select)(Query);
