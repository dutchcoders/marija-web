import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import Dimensions from 'react-dimensions';
import {Normalization} from "../interfaces/normalization";
import {Field} from "../../fields/interfaces/field";
import {Item} from "../interfaces/item";
import {Node} from "../interfaces/node";
import {FormEvent} from "react";
import {
	highlightNodes,
	nodesSelect,
	setTimelineGrouping
} from '../graphActions';
import {BarChart, XAxis, YAxis, Bar, Tooltip} from 'recharts';
import {Search} from "../../search/interfaces/search";
import {
	getNodesForDisplay, getTimelineGroups,
	TimelineGroups
} from "../graphSelectors";
import {AppState} from "../../main/interfaces/appState";
import TimelineSlider from './timelineSlider/timelineSlider';
import * as styles from './timeline.scss';
import { EventEmitter } from 'fbemitter';
import { TimelineGrouping } from '../interfaces/graphState';
import { getSelectedDateFields } from '../../fields/fieldsSelectors';

interface Props {
	onPaneEvent?: EventEmitter;
    normalizations: Normalization[];
    availableFields: Field[];
    dateFields: Field[];
    items: Item[];
    nodes: Node[];
    dispatch: Dispatch<any>;
    searches: Search[];
    timelineGroups: TimelineGroups;
	timelineGrouping: TimelineGrouping;
}

interface State {
}

class Timeline extends React.Component<Props, State> {
	isPlaying: boolean = false;
	container;
	barChart;

    componentDidMount() {
        const { onPaneEvent } = this.props;

		onPaneEvent.addListener('resized', this.onResized.bind(this));
		this.forceUpdate();
    }

    getSearchIds(): string[] {
		const { items } = this.props;

        return items.reduce((previous, item: Item) => {
			if (previous.indexOf(item.searchId) === -1) {
				return previous.concat([item.searchId]);
			}

			return previous;
		}, []);
    }

    getChartData(searchIds: string[]) {
		const { periods, groups } = this.props.timelineGroups;

		return periods.map(period => {
			const data = {
				name: period
			};

			searchIds.forEach(searchId => {
				const nodes: Node[] = this.getNodes(period).filter(node => node.searchIds.indexOf(searchId) !== -1);

				data[searchId] = nodes.length
			});

			return data;
		});
    }

    getChart() {
        const { items } = this.props;
		const { periods } = this.props.timelineGroups;

        if (!items.length || !this.container || !periods.length) {
            return;
        }

        const searchIds: string[] = this.getSearchIds();
        const chartData = this.getChartData(searchIds);
        const containerRect = this.container.getBoundingClientRect();

        return (
            <BarChart
				ref={ref => this.barChart = ref}
                width={containerRect.width}
                height={containerRect.height - 50}
                margin={{top: 0, right: 0, bottom: 0, left: 0}}
                data={chartData}>
                <XAxis dataKey="name" stroke="white" />
                <YAxis width={35} stroke="white" />
                <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{background: '#425269'}}
                    cursor={{fill: 'transparent'}}
                    formatter={value => value + ' nodes'}
                />
                {searchIds.map(searchId =>
                    <Bar
                        key={searchId}
                        dataKey={searchId}
                        stackId="a"
                        fill={this.getSearchColor(searchId)}
						isAnimationActive={false}
                    />
                )}
            </BarChart>
        );
    }

    private getNodes(period: string): Node[] {
        const { groups } = this.props.timelineGroups;

        if (groups[period]) {
        	return groups[period];
		}

        return [];
    }

    mouseEnterBar(bar) {
        const { dispatch } = this.props;
        const related = this.getNodes(bar.name);
        dispatch(highlightNodes(related));
    }

    mouseLeaveBar() {
        const { dispatch } = this.props;
        dispatch(highlightNodes([]));
    }

    mouseDownBar(bar) {
        const { dispatch } = this.props;
        const related = this.getNodes(bar.name);
        dispatch(nodesSelect(related));
    }

    getSearchColor(searchId: string): string {
        const { searches } = this.props;

        const search = searches.find(searchLoop => searchLoop.searchId === searchId);

        return search.color;
    }

    getActiveNodesInSlider(minFraction: number, maxFraction: number): Node[] {
		const searchIds = this.getSearchIds();
		const chartData = this.getChartData(searchIds);

		const xAxis = this.container.querySelector('.recharts-xAxis line');

		if (!xAxis) {
			return;
		}

		const xAxisRect: SVGRect = xAxis.getBBox();
		const minMiddlePoint: number = xAxisRect.width * minFraction + xAxisRect.x;
		const maxMiddlePoint: number = xAxisRect.width * maxFraction + xAxisRect.x;

		const bars: SVGRectElement[] = this.container.querySelectorAll('.recharts-bar-rectangle');
		const periods: string[] = [];

		bars.forEach((bar, index) => {
			const rect = bar.getBBox();
			const middlePoint = rect.x + rect.width / 2;

			if (middlePoint <= maxMiddlePoint && middlePoint >= minMiddlePoint) {
				periods.push(chartData[index].name);
			}
		});

		let nodes = [];

		periods.forEach(period =>
			nodes = nodes.concat(this.getNodes(period))
		);

		return nodes;
	}

    onSliderChange(minFraction: number, maxFraction: number) {
		const { dispatch } = this.props;

        const nodes = this.getActiveNodesInSlider(minFraction, maxFraction);

        if (nodes.length || !this.isPlaying) {
        	// Dont highlight when there are no nodes while we're playing the
			// slider animation
			dispatch(highlightNodes(nodes));
		}
    }

    onSliderSelect(minFraction: number, maxFraction: number) {
		const { dispatch } = this.props;

		const nodes = this.getActiveNodesInSlider(minFraction, maxFraction);

		dispatch(nodesSelect(nodes));
	}

    onStartPlaying() {
    	this.isPlaying = true;
	}

	onFinishPlaying() {
		this.isPlaying = false;
	}

	onResized() {
        this.forceUpdate();
    }

    onGroupingChange(ev: FormEvent<HTMLSelectElement>) {
    	const { dispatch } = this.props;

    	dispatch(setTimelineGrouping(ev.currentTarget.value as TimelineGrouping));
	}

    render() {
        const { nodes, dateFields, timelineGrouping } = this.props;
        const { periods } = this.props.timelineGroups;

        let noNodes = null;
        if (nodes.length === 0) {
            noNodes = <p>No search results available.</p>;
        }

        let noDateFields = null;
        if (dateFields.length === 0) {
            noDateFields = (
                <p>Select at least one date field in the datasource config.</p>
            );
        }

        let noDates = null;
        if (!noNodes && !noDateFields && periods.length === 0) {
        	noDates = (
        		<p>No date information was found in the search results.</p>
			);
		}

        const groupOptions: TimelineGrouping[] = [
        	'minute',
			'hour',
			'day',
			'week',
			'month'
		];

        let grouping = null;
        let slider = null;


        if (!noNodes && !noDateFields && !noDates) {
        	grouping = (
				<div className={styles.grouping}>
					<label className={styles.groupingLabel}>Group by</label>
					<select onChange={this.onGroupingChange.bind(this)} defaultValue={timelineGrouping} className={styles.selectGrouping}>
						{groupOptions.map(option => (
							<option value={option} key={option}>{option}</option>
						))}
					</select>
				</div>
			);

        	slider = (
				<div className={styles.sliderContainer}>
					<TimelineSlider
						playTime={periods.length * 600}
						playWindowWidth={Math.round(1 / periods.length * 100) / 100}
						onChange={this.onSliderChange.bind(this)}
						onSelect={this.onSliderSelect.bind(this)}
						onStartPlaying={this.onStartPlaying.bind(this)}
						onFinishPlaying={this.onFinishPlaying.bind(this)}
					/>
				</div>
			);
		}

        return (
            <div ref={ref => this.container = ref} className={styles.componentContainer}>
                { noNodes }
                { noDateFields }
				{ noDates }
                <div className={styles.chartContainer}>
                	{this.getChart()}
					{grouping}
					{slider}
				</div>
            </div>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        availableFields: state.fields.availableFields,
        nodes: getNodesForDisplay(state),
        normalizations: state.graph.normalizations,
        items: state.graph.items,
        searches: state.graph.searches,
		timelineGrouping: state.graph.timelineGrouping,
        timelineGroups: getTimelineGroups(state),
		dateFields: getSelectedDateFields(state)
    };
};

export default connect(select)(Dimensions()(Timeline));
