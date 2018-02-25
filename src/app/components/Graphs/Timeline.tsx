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

interface Props {
    normalizations: Normalization[];
    availableFields: Field[];
    fields: Field[];
    date_fields: Field[];
    items: Item[];
    selectedNodes: Node[];
    containerWidth: number;
    containerHeight: number;
    dispatch: Dispatch<any>;
}

interface State {
    showAllFields: boolean;
}

class Timeline extends React.Component<Props, State> {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    state: State = {
        showAllFields: false
    };

    constructor(props) {
        super(props);

        this.draw = this.draw.bind(this);
    }

    componentDidMount() {
        this.canvas = this.refs.canvas as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d');
        this.draw();
    }

    componentDidUpdate(prevProps, prevState) {
        console.debug("componentDidUpdate (histogram");
        // group items to periods using lodash? complete set
        // have selection filter and drag timeline to select nodes
        //

        this.draw();
    }

    draw() {
        const { normalizations, fields, date_fields, items, selectedNodes } = this.props;
        const { canvas } = this;

        if (!items.length || !date_fields.length) {
            return;
        }

        let itemsCopy = concat([], items);

        const context = this.context;
        context.save();

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = canvas.width - margin.left - margin.right,
            height = canvas.height - margin.top - margin.bottom;

        this.context.clearRect(0, 0, canvas.width, canvas.height);

        const x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .rangeRound([height, 0]);

        context.translate(margin.left, margin.top);

        const groupedResults = groupBy(itemsCopy, (result) => {
            for (var date_field of date_fields) {
                let date = fieldLocator(result.fields, date_field.path);
                if (!date) {
                    continue;
                }

                return moment(date).year() + '-' + moment(date).month();
            }
        });

        let minX = moment();

        items.forEach(item => {
            date_fields.forEach(field => {
                const date: any = fieldLocator(item.fields, field.path);

                if (!date) {
                    return;
                }

                const parsed: Moment = moment(date);

                if (parsed < minX) {
                    minX = parsed;
                }
            });
        });

        let maxX = moment();

        items.forEach(item => {
            date_fields.forEach(field => {
                const date: any = fieldLocator(item.fields, field.path);

                if (!date) {
                    return;
                }

                const parsed: Moment = moment(date);

                if (parsed > maxX) {
                    maxX = parsed;
                }
            });
        });

        const periods = [];

        let year = minX.year();
        let month = minX.month();
        for (; year < maxX.year() || (year == maxX.year() && month < maxX.month());) {
            month++;
            if (month > 12) {
                year++;
                month = 1;
            }

            periods.push(year + "-" + month);
        }

        x.domain(periods);

        const maxValue = reduce(groupedResults, (max, n, m) => (n.length > max ? n.length : max), 0);
        y.domain([0, maxValue]);

        const yTickCount = 10,
            yTicks = y.ticks(yTickCount),
            yTickFormat = y.tickFormat(yTickCount);

        context.beginPath();
        x.domain().forEach((d) => {
            context.moveTo(x(d) + x.bandwidth() / 2, height);
            context.lineTo(x(d) + x.bandwidth() / 2, height + 6);
        });

        // todo(nl5887): add selection
        // todo(nl5887): show difference between queries

        context.strokeStyle = "#b5b5b5";
        context.stroke();

        context.textAlign = "center";
        context.fillStyle = "#b5b5b5";
        context.textBaseline = "top";
        x.domain().forEach((d) => {
            context.fillText(d, x(d) + x.bandwidth() / 2, height + 6);
        });

        context.beginPath();
        yTicks.forEach((d) => {
            context.moveTo(0, y(d) + 0.5);
            context.lineTo(-6, y(d) + 0.5);
        });
        context.strokeStyle = "#b5b5b5";
        context.stroke();

        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = "#b5b5b5";
        yTicks.forEach((d) => {
            context.fillText(yTickFormat(d), -9, y(d));
        });

        context.beginPath();
        context.moveTo(-6.5, 0 + 0.5);
        context.lineTo(0.5, 0 + 0.5);
        context.lineTo(0.5, height + 0.5);
        context.lineTo(-6.5, height + 0.5);
        context.strokeStyle = "#b5b5b5";
        context.stroke();

        context.fillStyle = "#57c17b";

        forEach(groupedResults, (d, v) => {
            context.fillRect(x(v), y(d.length), x.bandwidth(), height - y(d.length));
        });

        if (selectedNodes.length > 0) {
            itemsCopy = filter(itemsCopy, (item) => {
                // check if node contains item
                return reduce(fields, (found, field) => {
                    const val = fieldLocator(item.fields, field.path);
                    if (!val) {return found;}

                    return found || find(selectedNodes, (o) => {
                        return (o.id === normalize(normalizations, val));
                    });
                }, false);
            });

            const groupedResultsSelection = groupBy(itemsCopy, (result) => {
                for (var date_field of date_fields) {
                    let date = fieldLocator(result.fields, date_field.path);
                    if (!date) {
                        continue;
                    }

                    return moment(date).year() + '-' + moment(date).month();
                }
            });

            context.fillStyle = "#fac04b";
            forEach(groupedResultsSelection, (d, v) => {
                context.fillRect(x(v), y(d.length), x.bandwidth(), height - y(d.length));
            });
        }


        context.restore();
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

    render() {
        const { items, containerHeight, containerWidth, date_fields } = this.props;

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

        const showCanvas: boolean = !noDateFields && !noitems;

        return (
            <div>
                { this.selectDateFields() }
                { noitems }
                { noDateFields }
                <canvas
                    className={showCanvas ? '' : 'hidden'}
                    width={ containerWidth }
                    height={ containerHeight - 30 }
                    ref="canvas"
                />
            </div>
        );

    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        availableFields: state.fields.availableFields,
        selectedNodes: state.entries.nodes.filter(node => node.selected),
        queries: state.entries.queries,
        fields: state.entries.fields,
        normalizations: state.entries.normalizations,
        date_fields: state.entries.date_fields,
        items: state.entries.items
    };
};

export default connect(select)(Dimensions()(Timeline));
