import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map, groupBy, reduce, forEach } from 'lodash';

import * as d3 from 'd3';
import moment from 'moment';

import { fieldLocator } from '../../helpers/index';

class Histogram extends React.Component {
    constructor(props) {
        super(props);

        this.draw = this.draw.bind(this);
        this.state = {};
    }

    componentDidMount() {
        this.canvas = this.refs.canvas;
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
        const { items } = this.props;
        const { canvas } = this;

        if (!items.length) {
            return;
        }

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

        const groupedResults = groupBy(this.props.items, (result) => {
            return moment(fieldLocator(result.fields, 'date')).year() + '-' + moment(fieldLocator(result.fields, 'date')).month();
        });

        const minX = reduce(this.props.items, (min, result) => {
            return (moment(fieldLocator(result.fields, 'date')) < min ? moment(fieldLocator(result.fields, 'date')) : min);
        }, moment());

        const maxX = reduce(this.props.items, (max, result) => {
            return (moment(fieldLocator(result.fields, 'date')) > max ? moment(fieldLocator(result.fields, 'date')) : max);
        }, 0);

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

        context.strokeStyle = "black";
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "top";
        x.domain().forEach((d) => {
            context.fillText(d, x(d) + x.bandwidth() / 2, height + 6);
        });

        context.beginPath();
        yTicks.forEach((d) => {
            context.moveTo(0, y(d) + 0.5);
            context.lineTo(-6, y(d) + 0.5);
        });
        context.strokeStyle = "black";
        context.stroke();

        context.textAlign = "right";
        context.textBaseline = "middle";
        yTicks.forEach((d) => {
            context.fillText(yTickFormat(d), -9, y(d));
        });

        context.beginPath();
        context.moveTo(-6.5, 0 + 0.5);
        context.lineTo(0.5, 0 + 0.5);
        context.lineTo(0.5, height + 0.5);
        context.lineTo(-6.5, height + 0.5);
        context.strokeStyle = "black";
        context.stroke();

        context.fillStyle = "steelblue";

        forEach(groupedResults, (d, v) => {
            context.fillRect(x(v), y(d.length), x.bandwidth(), height - y(d.length));
        });

        context.restore();
    }

    render() {

        return (
            <canvas
                width={ this.props.width }
                height={ this.props.height }
                ref="canvas"
            />
        );

    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        node: state.entries.node,
        queries: state.entries.queries,
        fields: state.entries.fields,
        items: state.entries.items,
        highlight_nodes: state.entries.highlight_nodes,
    }
}

export default connect(select)(Histogram);