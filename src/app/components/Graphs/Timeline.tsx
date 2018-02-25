import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import { find, map, groupBy, reduce, forEach, filter, concat } from 'lodash';
import Dimensions from 'react-dimensions';
import * as d3 from 'd3';
import * as moment from 'moment';
import { normalize, fieldLocator } from '../../helpers/index';
import {Normalization} from "../../interfaces/normalization";
import {Field} from "../../interfaces/field";
import {Item} from "../../interfaces/item";
import {Node} from "../../interfaces/node";
import {Moment} from "moment";
import {FormEvent} from "react";
import {dateFieldAdd, dateFieldDelete} from '../../modules/data/actions';
import {searchFieldsUpdate} from '../../modules/search/actions';
import {highlightNodes, nodesSelect} from '../../modules/graph/actions';
import {BarChart, XAxis, YAxis, Bar} from 'recharts';
import {Search} from "../../interfaces/search";

interface Props {
    normalizations: Normalization[];
    availableFields: Field[];
    fields: Field[];
    date_fields: Field[];
    items: Item[];
    nodes: Node[];
    containerWidth: number;
    containerHeight: number;
    dispatch: Dispatch<any>;
    searches: Search[];
}

interface State {
    showAllFields: boolean;
    groupedResults: {
        [period: string]: Item[]
    };
    periods: string[]
}

class Timeline extends React.Component<Props, State> {
    state: State = {
        showAllFields: false,
        groupedResults: {},
        periods: []
    };

    setGroupsAndPeriods(items) {
        const { date_fields } = this.props;
        const times: Moment[] = [];

        const groupedResults = groupBy(items, (result) => {
            for (var date_field of date_fields) {
                let date = fieldLocator(result.fields, date_field.path);
                if (!date) {
                    continue;
                }

                const parsed = moment(date);
                times.push(parsed);

                return parsed.year() + '-' + (parsed.month() + 1);
            }
        });

        times.sort((a: Moment, b: Moment) => {
            return a.unix() - b.unix();
        });

        const periods: string[] = [];

        times.forEach(moment => {
            const string: string = moment.year() + '-' + (moment.month() + 1);

            if (periods.indexOf(string) === -1) {
                periods.push(string);
            }
        });

        this.setState({
            groupedResults: groupedResults,
            periods: periods
        });
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.items !== this.props.items) {
            this.setGroupsAndPeriods(nextProps.items);
        }
    }

    handleFieldChange(event: FormEvent<HTMLInputElement>, field: Field) {
        const { dispatch } = this.props;

        if (event.currentTarget.checked) {
            dispatch(dateFieldAdd(field));
            dispatch(searchFieldsUpdate());
        } else {
            dispatch(dateFieldDelete(field));
        }
    }

    renderDateField(field: Field) {
        const { date_fields } = this.props;
        const isSelected: boolean = typeof date_fields.find(search =>
            search.path === field.path
        ) !== 'undefined';

        return (
            <label className="dateField" key={field.path}>
                <input
                    type="checkbox"
                    defaultChecked={isSelected}
                    onChange={event => this.handleFieldChange(event, field)}
                />
                <span>{field.path}</span>
            </label>
        );
    }

    selectDateFields() {
        const { availableFields } = this.props;
        const { showAllFields } = this.state;
        const availableDateFields = availableFields.filter(field => field.type === 'date');

        let toggleAllFieldsButton = null;

        if (availableDateFields.length > 10) {
            toggleAllFieldsButton = (
                <button
                    onClick={this.toggleAllFields.bind(this)}
                    className="toggleAllFields">
                    {showAllFields ? 'Show less' : 'Show all'}
                </button>
            );

            if (!showAllFields) {
                availableDateFields.splice(10);
            }
        }

        return (
            <div className="dateFields">
                {availableDateFields.map(field => this.renderDateField(field))}
                {toggleAllFieldsButton}
            </div>
        );
    }

    toggleAllFields() {
        this.setState({
            showAllFields: !this.state.showAllFields
        });
    }

    getChart() {
        const { date_fields, items, containerHeight, containerWidth } = this.props;
        const { periods, groupedResults } = this.state;

        if (!items.length || !date_fields.length) {
            return;
        }

        const queries: string[] = items.reduce((previous, item: Item) => {
            if (previous.indexOf(item.query) === -1) {
                return previous.concat([item.query]);
            }

            return previous;
        }, []);

        const chartData = periods.map(period => {
            const data = {
                name: period
            };

            queries.forEach(query => {
                data[query] = groupedResults[period].filter(item => item.query === query).length
            });

            return data;
        });

        return (
            <BarChart
                width={containerWidth}
                height={containerHeight - 30}
                margin={{top: 0, right: 0, bottom: 0, left: 0}}
                data={chartData}>
                <XAxis dataKey="name" stroke="white"/>
                <YAxis stroke="white" width={25} />
                {queries.map(query =>
                    <Bar
                        key={query}
                        dataKey={query}
                        onMouseEnter={this.mouseEnterBar.bind(this)}
                        onMouseLeave={this.mouseLeaveBar.bind(this)}
                        onMouseDown={this.mouseDownBar.bind(this)}
                        stackId="a"
                        fill={this.getQueryColor(query)}
                    />
                )}
            </BarChart>
        );
    }

    private getNodes(period: string): Node[] {
        const { groupedResults } = this.state;
        const { nodes } = this.props;

        const itemIds = groupedResults[period].map(item => item.id);

        return nodes.filter(node => {
            const found: string = node.items.find(id => itemIds.indexOf(id) !== -1);
            return typeof found !== 'undefined';
        });
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

    getQueryColor(query: string): string {
        const { searches } = this.props;

        const search = searches.find(searchLoop => searchLoop.q === query);

        return search.color;
    }

    render() {
        const { items, date_fields } = this.props;

        let noitems = null; 
        if (items.length === 0) {
            noitems = <p>No search results available.</p>;
        }

        let noDateFields = null;
        if (date_fields.length === 0) {
            noDateFields = (
                <p>Select at least one date field above.</p>
            );
        }

        let chart = null;
        if (!noDateFields && !noitems) {
            chart = this.getChart();
        }

        return (
            <div>
                { this.selectDateFields() }
                { noitems }
                { noDateFields }
                { chart }
            </div>
        );

    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        availableFields: state.fields.availableFields,
        nodes: state.entries.nodes,
        queries: state.entries.queries,
        fields: state.entries.fields,
        normalizations: state.entries.normalizations,
        date_fields: state.entries.date_fields,
        items: state.entries.items,
        searches: state.entries.searches
    };
};

export default connect(select)(Dimensions()(Timeline));
