import { isEqual } from 'lodash';
import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { cancelRequest, error } from '../../connection/connectionActions';
import { deleteNodes, deselectNodes, nodesSelect } from '../../graph/graphActions';
import { Node } from '../../graph/interfaces/node';
import Url from '../../main/helpers/url';
import Icon from '../../ui/components/icon';
import { Search } from '../interfaces/search';
import {
	activateLiveDatasource,
	confirmItems,
	deactivateLiveDatasource,
	deleteSearch, dismissItemsToConfirm, editDateFilter,
	editSearch,
	pauseSearch,
	resumeSearch
} from '../searchActions';
import ColorPicker from '../../ui/components/colorPicker/colorPicker';
import {
	getSelectedNodes,
	selectItemsBySearchId
} from '../../graph/graphSelectors';
import DateFilter from './dateFilter/dateFilter';
import { Item } from '../../graph/interfaces/item';

interface Props {
    dispatch: Dispatch<any>;
    search: Search;
    nodes: Node[];
    selectedNodes: Node[];
    items: Item[];
}

interface State {
    isColorPickerOpen: boolean;
}

class Query extends React.Component<Props, State> {
    state: State = {
		isColorPickerOpen: false
    };

    dismissItemsToConfirm() {
		const { dispatch, search } = this.props;

		dispatch(dismissItemsToConfirm(search));
    }

    handleDelete() {
        const { dispatch, search } = this.props;

        if (!search.completed) {
            dispatch(cancelRequest(search.requestId));
        }

        Url.removeQuery(search.q);
        dispatch(deleteSearch(search));
    }

    handleDeleteNodes() {
        const { dispatch, search, nodes } = this.props;

        const queryNodes: Node[] = nodes.filter(node => node.searchIds.indexOf(search.searchId) !== -1);

        dispatch(deleteNodes(queryNodes));
    }

    handleDisplayMore() {
        const { dispatch, search } = this.props;
        const nodes = this.countItems();
        const newNumber = search.displayItems + 100;

        if (newNumber > Math.ceil(nodes / 100) * 100) {
            return;
        }

        dispatch(editSearch(search.searchId, {
            displayItems: newNumber
        }));
    }

    handleDisplayLess() {
        const { dispatch, search } = this.props;
        const displayItems = this.countDisplayItems();
        let newNumber = search.displayItems - 100;

        if (displayItems <= newNumber) {
            newNumber = Math.floor(displayItems/ 100) * 100 - 100;
        }

        if (newNumber < 0) {
            return;
        }

        dispatch(editSearch(search.searchId, {
            displayItems: newNumber
        }));
    }

    countItems() {
        const { items } = this.props;

        return items.length;
    }

    countDisplayItems() {
        const { items } = this.props;

        return items.filter(item => item.display).length;
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

        dispatch(activateLiveDatasource(search.liveDatasource));
    }

    deactivateLiveDatasource() {
        const { search, dispatch } = this.props;

        dispatch(deactivateLiveDatasource(search.liveDatasource));
    }

    onColorChange(color: string) {
		const { search, dispatch } = this.props;

		dispatch(editSearch(search.searchId, {
			color
		}));

		this.setState({
			isColorPickerOpen: false
		});
    }

    toggleColorPicker() {
		const { isColorPickerOpen } = this.state;

		this.setState({
			isColorPickerOpen: !isColorPickerOpen
		});
    }

    confirmItems() {
    	const { search, dispatch } = this.props;

    	dispatch(confirmItems(search));
	}

	closeError() {
		const { search, dispatch } = this.props;

		dispatch(error(null, search.requestId));
	}

	handleDateFilterChange(date: string) {
    	const { search, dispatch } = this.props;

    	dispatch(editDateFilter(search, date));
	}

    render() {
        const { search } = this.props;
        const { isColorPickerOpen } = this.state;

        const displayItems: number = this.countDisplayItems();
        const items: number = this.countItems();
        const lessClass = 'ion ion-ios-minus ' + (displayItems <= 0 ? 'disabled' : '');
        const moreClass = 'ion ion-ios-plus ' + (displayItems === items ? 'disabled' : '');
        const loading: boolean = !search.completed && !search.paused;

        let count = null;

        if (!search.liveDatasource || !search.paused) {
            count = (
                <span className="count">
                    {displayItems}/{search.total}
                </span>
            );
        }

        let actions = [];

        if (!search.liveDatasource && !search.error) {
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

        if (!search.completed && !search.paused && !search.liveDatasource && !search.error) {
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

        if (!search.completed && search.paused && !search.liveDatasource && !search.error) {
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

        if ((!search.liveDatasource || !search.paused || items > 0) && !search.error) {
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
                    <Icon onClick={this.toggleColorPicker.bind(this)} name="ion-ios-gear"/>
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

        if (search.liveDatasource && items > 0) {
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

        if (search.liveDatasource && search.paused && !search.error) {
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

        if (search.liveDatasource && !search.paused && !search.error) {
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

        if (loading && !search.error) {
            animation = <div className="queryAnimation" />;
        }

        return (
        	<div className="queryWrapper">
				<div key={search.searchId} style={{backgroundColor: search.color}} className={'query' +  (search.error ? ' queryWithError' : '')}>
					{animation}
					<div className="queryInner" style={{backgroundColor: search.color}}>
						{search.q}&nbsp;
						{count}

						<div className="actions">
							{actions}
						</div>
					</div>
				</div>

				{isColorPickerOpen && (
					<div className="editQuery">
						{search.advancedQuery.length > 0 && (
							<DateFilter date={search.advancedQuery[0].selectedValue} onChange={this.handleDateFilterChange.bind(this)}/>
						)}
						<ColorPicker selected={search.color} onChange={this.onColorChange.bind(this)}/>
					</div>
				)}

                {search.itemsToConfirm.length > 0 && (
                    <div className="confirmItems">
						<p className="confirmMessage">
                        	{search.itemsToConfirm.length} new search results found. Would you like to continue?
						</p>
						<button onClick={this.confirmItems.bind(this)} className="confirmContinue">Continue</button>
						<button onClick={this.dismissItemsToConfirm.bind(this)} className="confirmCancel">Dismiss results</button>
                    </div>
                )}

				{search.error && (
					<div className="searchError">
						<p>{search.error}</p>
					</div>
				)}
			</div>
        );
    }
}

const select = (state, ownProps) => ({
	...ownProps,
	selectedNodes: getSelectedNodes(state),
	items: selectItemsBySearchId(state, ownProps.search.searchId)
});

export default connect(select)(Query);
