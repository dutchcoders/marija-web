import React, { Component } from 'react';
import { connect } from 'react-redux';

import * as d3 from 'd3';
import { map, groupBy, reduce, forEach, difference, find, uniq, remove, each, includes, assign } from 'lodash';
import moment from 'moment';

import { selectNodes } from '../../modules/data/index';
import { phone, fieldLocator } from '../../helpers/index';

class Graph extends React.Component {
    componentDidMount() {
        const { network } = this;
        const { dispatch } = this.props;

        network.dispatch = dispatch;
        network.onmouseclick = this.onMouseClick.bind(this);
        network.onmousemove = this.onMouseMove.bind(this);

        network.setup(this.refs["canvas"]);
    }

    constructor(props) {
        super(props);

        this.state = {
            nodes: [],
            links: [],
            highlight_nodes: [],
            edges: [],
            clusters: {},
            start: new Date(),
            time: 0,
            n: {
                id: 'test',
            },
            ticks: 0
        };

        this.network = {
            graph: {
                "nodes": [],
                "links": [],
                "highlight_nodes": [],
                selection: null,
                selectedNodes: [],
                tooltip: null,
                transform: d3.zoomIdentity,
                queries: []
            },
            simulation: {},
            // Graph design
            width: 1600,
            height: 800,
            lines: {
                stroke: {
                    color: "#ccc",
                    thickness: 1
                }
            },
            nodes: {
                fill: {
                    color: "#333"
                },
                stroke: {
                    color: "#fff",
                    thickness: 3
                },
                sizeRange: [12, 30]
            },
            zoomed: function () {
                this.graph.transform = d3.event.transform;
            },
            setup: function (el) {
                this.render = this.render.bind(this);
                this.drawNode = this.drawNode.bind(this);
                this.drawLink = this.drawLink.bind(this);

                this.canvas = el;
                this.context = this.canvas.getContext('2d');
                var canvas = d3.select(this.canvas);

                canvas.on("mousedown", this.mousedown.bind(this))
                    .on("mousemove", this.mousemove.bind(this))
                    .on("mouseup", this.mouseup.bind(this))
                    .call(d3.drag()
                        .filter(() => {
                            return d3.event.altKey;
                        })
                        .subject(this.dragsubject.bind(this))
                        .on("start", this.dragstarted.bind(this))
                        .on("drag", this.dragged.bind(this))
                        .on("end", this.dragended.bind(this))
                    )
                    .call(d3.zoom()
                        .filter(() => {
                            return d3.event.altKey;
                        })
                        .scaleExtent([1 / 2, 8])
                        .on("zoom", this.zoomed.bind(this))
                    );

                this.simulation = d3.forceSimulation()
                    .stop()
                    .force("link", d3.forceLink().id(function (d) {
                        return d.id;
                    }))
                    .force("charge", d3.forceManyBody().strength(-100).distanceMax(300))
                    .force("center", d3.forceCenter(this.width / 2, this.height / 2))
                    .force("vertical", d3.forceY().strength(0.018))
                    .force("horizontal", d3.forceX().strength(0.006));

                this.render();
            },
            forceScale: function (node) {
                var scale = d3.scaleLog().domain(this.nodes.sizeRange).range(this.nodes.sizeRange.slice().reverse());
                return node.r + scale(node.r);
            },
            select: function (nodes) {
                this.graph.selectedNodes = nodes;
            },
            highlight: function (nodes) {
                this.graph.highlight_nodes = nodes;
            },
            addNodes: function (graph) {
                var countExtent = d3.extent(graph.nodes, function (d) {
                        return d.connections;
                    }),
                    radiusScale = d3.scalePow().exponent(2).domain(countExtent).range(this.nodes.sizeRange);

                var newNodes = false;

                var that = this;
                each(graph.nodes, function (node) {
                    var n = find(that.graph.nodes, {id: node.id});
                    if (n) {
                        n.connections++;

                        n.r = radiusScale(n.connections);
                        n.force = that.forceScale(n);

                        n.query.push(node.query);
                        n.query = uniq(n.query);

                        n.color.push(node.color);
                        n.color = uniq(n.color);

                        return;
                    }

                    node.color = [node.color];
                    node.query = [node.query];
                    node.force = that.forceScale(node);
                    node.r = radiusScale(node.connections);
                    node.icon = "\uF047";

                    that.graph.nodes.push(node);

                    newNodes = true;
                });

                this.graph.links = this.graph.links.concat(graph.links);

                if (!newNodes)
                    return;

                this.simulation
                    .nodes(this.graph.nodes);

                this.simulation.force("link")
                    .links(this.graph.links);

                this.simulation.alpha(0.3).restart();
            },
            removeNodes: function (removed) {
                // remove nodes
                this.graph.nodes = remove(this.graph.nodes, (n) => {
                    return find(removed, {id: n});
                });

                // find links
                this.graph.links = remove(this.graph.links, (n) => {
                    return find(removed, {id: n.source.id}) || find(removed, {id: n.target.id});
                });
            },
            render: function () {
                if (!this.graph) {
                    return false;
                }

                this.context.save();
                this.context.clearRect(0, 0, this.width, this.height);

                this.context.translate((0) + this.graph.transform.x, (0) + this.graph.transform.y);

                this.context.scale(this.graph.transform.k, this.graph.transform.k);

                this.context.beginPath();

                this.graph.links.forEach((d)=> {
                    this.drawLink(d);
                });

                this.context.strokeStyle = this.lines.stroke.color;
                this.context.lineWidth = this.lines.stroke.thickness;
                this.context.stroke();

                this.graph.nodes.forEach((d)=> {
                    this.drawNode(d);
                });

                if (this.graph.selection) {
                    this.context.beginPath();
                    this.context.strokeStyle = '#c0c0c0';
                    this.context.fillStyle = "rgba(224, 224, 224, 0.6)";
                    //this.context.fillStyle = '#eee';
                    this.context.lineWidth = 1;
                    // this.context.setLineDash([6]);

                    this.context.rect(this.graph.selection.x1, this.graph.selection.y1, this.graph.selection.x2 - this.graph.selection.x1, this.graph.selection.y2 - this.graph.selection.y1);
                    this.context.fill();
                    this.context.stroke();
                }

                if (this.graph.tooltip) {
                    this.context.fillStyle = '#000'; //d.color[0];
                    this.context.font = "14px Arial";
                    this.context.fillText(this.graph.tooltip.node.id, this.graph.tooltip.x + 5, this.graph.tooltip.y - 5);
                }

                this.context.restore();

                requestAnimationFrame(this.render);
            },
            drawLink: function (d) {
                this.context.moveTo(d.source.x, d.source.y);
                this.context.lineTo(d.target.x, d.target.y);
            },
            drawNode: function (d) {
                // this.context.moveTo(d.x + d.r, d.y);
                // for each different query, show a part. This will show that the edge
                //  has been found in multiple queries.
                for (var i = 0; i < d.query.length; i++) {
                    // find color

                    this.context.beginPath();
                    this.context.arc(d.x, d.y, d.r, 2 * Math.PI * (i / d.color.length), 2 * Math.PI * ( (i + 1) / d.color.length));

                    var color = '#000'; // d.searches[i];

                    for (var j = 0; j < this.graph.queries.length; j++) {
                        if (this.graph.queries[j].q === d.query[i])
                            color = this.graph.queries[j].color;
                    }

                    this.context.fillStyle = color;
                    this.context.fill();

                    if (includes(this.graph.selectedNodes, d)) {
                        this.context.strokeStyle = '#993833';
                        this.context.lineWidth = this.nodes.stroke.thickness;
                        this.context.stroke();
                    }
                }

                // this.context.font="14px FontAwesome";
                // this.context.fillStyle = '#fff';
                // this.context.fillText(d.icon, d.x - ( d.r) + 1, d.y + 5);
            },
            mousedown: function () {
                const { dispatch } = this;

                if (d3.event.altKeys) {
                    return;
                }

                var x = this.graph.transform.invertX(d3.event.layerX),
                    y = this.graph.transform.invertY(d3.event.layerY);

                var subject = this.simulation.find(x, y, 20);
                if (subject === undefined) {
                    this.graph.selection = {x1: x, y1: y, x2: x, y2: y};
                    dispatch(selectNodes({nodes: []}));
                    return;
                } else {
                    if (!includes(this.graph.selectedNodes, subject)) {
                        this.graph.selectedNodes.push(subject);
                    } else {
                        remove(this.graph.selectedNodes, subject);
                    }

                    dispatch(selectNodes({nodes: this.graph.selectedNodes}));

                    this.onmouseclick(subject);
                }
            },
            mouseup: function () {
                if (d3.event.altKeys) {
                    return;
                }

                var x = this.graph.transform.invertX(d3.event.layerX),
                    y = this.graph.transform.invertY(d3.event.layerY);

                // find all nodes within selection and highliht
                this.graph.selection = null;
            },
            mousemove: function (n) {
                const { dispatch } = this;
                if (d3.event.altKeys) {
                    return;
                }

                var x = this.graph.transform.invertX(d3.event.layerX),
                    y = this.graph.transform.invertY(d3.event.layerY);

                if (this.graph.selection) {
                    this.graph.selection = assign(this.graph.selection, {x2: x, y2: y});

                    this.graph.nodes.forEach((d)=> {
                        if ((d.x > this.graph.selection.x1 && d.x < this.graph.selection.x2) &&
                            (d.y > this.graph.selection.y1 && d.y < this.graph.selection.y2)) {
                            if (!includes(this.graph.selectedNodes, d)) {
                                this.graph.selectedNodes.push(d);
                            }
                        }

                        if ((d.x > this.graph.selection.x2 && d.x < this.graph.selection.x1) &&
                            (d.y > this.graph.selection.y2 && d.y < this.graph.selection.y1)) {
                            if (!includes(this.graph.selectedNodes, d)) {
                                this.graph.selectedNodes.push(d);
                            }
                        }
                    });

                    dispatch(selectNodes({nodes: this.graph.selectedNodes}));
                    return;
                }

                var subject = this.simulation.find(x, y, 20);
                if (subject === undefined) {
                    this.graph.tooltip = null;
                } else {
                    this.graph.tooltip = {node: subject, x: x, y: y};
                    this.onmousemove(subject);
                }
            },
            dragstarted: function () {
                this.graph.selection = null;
                this.graph.tooltip = null;

                var x = d3.event.x,
                    y = d3.event.y;

                if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
                d3.event.subject.fx = x;
                d3.event.subject.fy = y;
            },
            dragged: function () {
                var x = d3.event.x,
                    y = d3.event.y;

                d3.event.subject.fx = (x);
                d3.event.subject.fy = (y);
            },
            dragended: function () {
                if (!d3.event.active) this.simulation.alphaTarget(0);
                d3.event.subject.fx = null;
                d3.event.subject.fy = null;
            },
            dragsubject: function () {
                const x = this.graph.transform.invertX(d3.event.x),
                    y = this.graph.transform.invertY(d3.event.y);

                return this.simulation.find(x, y, 20);
            },
            mousemoved: function () {
            }
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }

    onPortMouseOver(link) {
    }

    onMouseClick(node) {
        //store.dispatch(selectNode({node:node}));
    }

    onMouseMove(node) {
        // store.dispatch(selectNode({node:node}));
    }

    onMouseOver(node) {
        // store.dispatch(selectNode({node:node}));
    }

    componentWillReceiveProps(nextProps) {
        // console.debug("will receive props", nextProps);
    }

    componentDidUpdate(prevProps, prevState) {
        console.debug(this.props);
        const { dispatch } = this.props;
        const { network } = this;

        network.graph.queries = this.props.queries;

        var { fields } = this.props;

        var nodes = [];
        var links = [];

        var removed = difference(prevProps.items, this.props.items);
        if (removed.length > 0) {
            var removed2 = [];
            forEach(removed, (d, i) => {
                forEach(fields, (field) => {
                    const value = fieldLocator(d.fields, field);

                    if (value) {
                        removed2.push(value);
                    }

                });
            });

            // this should be node id not packet
            network.removeNodes({
                nodes: removed2,
            });
        }


        if (this.props.items.length > 0) {
            forEach(this.props.items, (d, i) => {
                forEach(fields, (field) => {
                    const value = fieldLocator(d.fields, field);
                    if (!value) return;

                    nodes.push({
                        id: phone(value),
                        query: d.q,
                        name: value,
                        color: d.color,
                        connections: 1
                    });
                });


                forEach(fields, (source) => {
                    const sourceValue = fieldLocator(d.fields, source);
                    if (!sourceValue) return;

                    forEach(fields, (target) => {
                        const targetValue = fieldLocator(d.fields, target);
                        if (!targetValue) return;

                        links.push({
                            source: phone(sourceValue),
                            target: phone(targetValue),
                        });
                    });
                });
            });

            network.addNodes({
                nodes: nodes,
                links: links,
            });
        }
        network.select(this.props.node);
        network.highlight(this.props.highlight_nodes);
    }

    render() {
        var style = {fontFamily: 'fontAwesome'};
        return (
            <canvas
                style={style}
                ref='canvas'
                width={ this.props.width }
                height={ this.props.height }
                ref="canvas">
                histogram
            </canvas>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        node: state.entries.node,
        queries: state.entries.searches,
        fields: state.entries.fields,
        items: state.entries.items,
        highlight_nodes: state.entries.highlight_nodes,
    }
}

export default connect(select)(Graph);