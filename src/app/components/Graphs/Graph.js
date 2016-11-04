import React, {Component} from 'react';
import { connect} from 'react-redux';
import Dimensions from 'react-dimensions';

import * as d3 from 'd3';
import { map, groupBy, reduce, forEach, difference, find, uniq, remove, each, includes, assign } from 'lodash';
import moment from 'moment';

import { selectNodes, selectNode } from '../../modules/data/index';
import { normalize, fieldLocator } from '../../helpers/index';

class Graph extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nodes: [],
            links: [],
            highlight_nodes: [],
            edges: [],
            queries: [],
            clusters: {},
            start: new Date(),
            time: 0,
            n: {
                id: 'test',
            },
            ticks: 0
        };

        const { containerHeight, containerWidth } = props;

        this.network = {
            graph: {
                nodes: [],
                links: [],
                highlight_nodes: [],
                selection: null,
                queries: [],
                selectedNodes: [],
                tooltip: null,
                transform: d3.zoomIdentity
            },
            height: containerHeight,
            width: containerWidth,
            simulation: {},
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
            updateNodes: function (graph) {
                var countExtent = d3.extent(graph.nodes, function (d) {
                        return d.connections;
                    }),
                    radiusScale = d3.scalePow().exponent(2).domain(countExtent).range(this.nodes.sizeRange);

                var newNodes = false;

                var that = this;

                // remove deleted nodes
                remove(this.graph.nodes, (n) => {
                    return !find(graph.nodes, (o) => {
                        return (o.id==n.id);
                    });
                });

                each(graph.nodes, function (node) {
                    // todo(nl5887): cleanup
                    var n = find(that.graph.nodes, {id: node.id});
                    if (n) {
                        n = assign(n, node);
                        n = assign(n, {force: that.forceScale(n), r: radiusScale(n.connections)});
                        return;
                    }

                    let node2 = _.clone(node);
                    node2 = assign(node2, {force: that.forceScale(node2), r: radiusScale(node2.connections)});

                    that.graph.nodes.push(node2);

                    newNodes = true;
                });

                remove(this.graph.links, (link) => {
                    return !find(graph.links, (o) => {
                        return (link.source.id == o.source && link.target.id == o.target);
                    });
                });

                each(graph.links, function (link) {
                    var n = find(that.graph.links, (o) => {
                        return o.source.id == link.source && o.target.id == link.target;
                    });

                    if (n) {
                        return;
                    }

                    // todo(nl5887): why?

                    that.graph.links.push({source: link.source, target: link.target});
                });

                this.graph.queries = graph.queries;

                if (!newNodes)
                    {return;}

                this.simulation
                    .nodes(this.graph.nodes);

                this.simulation.force("link")
                    .links(this.graph.links);

                this.simulation.alpha(0.3).restart();
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

                // only when simulation is running?
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
                for (var i = 0; i < d.queries.length; i++) {
                    // find color
                    this.context.beginPath();

                    this.context.moveTo(d.x, d.y);
                    this.context.arc(d.x, d.y, d.r, 2 * Math.PI * (i / d.queries.length), 2 * Math.PI * ( (i + 1) / d.queries.length));
                    this.context.lineTo(d.x, d.y);

                    var color = '#000'; // d.searches[i];

                    for (var j = 0; j < this.graph.queries.length; j++) {
                        if (this.graph.queries[j].q === d.queries[i])
                            {color = this.graph.queries[j].color;}
                    }

                    this.context.fillStyle = color;
                    this.context.fill();

                    this.context.strokeStyle = color;
                    this.context.stroke();

                }

                if (includes(this.graph.selectedNodes, d)) {
                    this.context.strokeStyle = '#993833';
                    this.context.lineWidth = this.nodes.stroke.thickness;

                    this.context.beginPath();
                    this.context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
                    this.context.stroke();
                }

                if (d.icon) {
                    let fontHeight = 12 + Math.floor(0.5*d.r);
                    this.context.font=fontHeight + "px glyphicons halflings";
                    this.context.fillStyle = '#fff';

                    const {width} = this.context.measureText(d.icon);
                    this.context.fillText(d.icon, d.x - (width/2), d.y + (d.r) - ((fontHeight*0.4)/2));
                }
            },
            mousedown: function () {
                const { dispatch, graph } = this;

                if (d3.event.altKey) {
                    return;
                }

                var x = graph.transform.invertX(d3.event.layerX),
                    y = graph.transform.invertY(d3.event.layerY);

                var subject = this.simulation.find(x, y, 20);
                if (!subject) {
                    graph.selection = {x1: x, y1: y, x2: x, y2: y};
                    dispatch(selectNodes({nodes: []}));
                    return;
                } else {
                    if (!includes(graph.selectedNodes, subject)) {
                        graph.selectedNodes.push(subject);
                    } else {
                        remove(graph.selectedNodes, subject);
                    }

                    dispatch(selectNodes({nodes: graph.selectedNodes}));
                }
            },
            mouseup: function () {
                const { graph, dispatch } = this;

                if (d3.event.altKey) {
                    return;
                }

                var x = graph.transform.invertX(d3.event.layerX),
                y = graph.transform.invertY(d3.event.layerY);

                if (graph.selection) {
                    graph.selection = assign(graph.selection, {x2: x, y2: y});

                    graph.nodes.forEach((d)=> {
                        if ((d.x > graph.selection.x1 && d.x < graph.selection.x2) &&
                                (d.y > graph.selection.y1 && d.y < graph.selection.y2)) {
                            if (!includes(graph.selectedNodes, d)) {
                                graph.selectedNodes.push(d);
                            }
                        }

                        if ((d.x > graph.selection.x2 && d.x < graph.selection.x1) &&
                                (d.y > graph.selection.y2 && d.y < graph.selection.y1)) {
                            if (!includes(graph.selectedNodes, d)) {
                                graph.selectedNodes.push(d);
                            }
                        }
                    });

                    dispatch(selectNodes({nodes: graph.selectedNodes}));

                    graph.selection = null;
                }
            },
            mousemove: function (n) {
                const { dispatch, graph } = this;

                if (d3.event.altKey) {
                    return;
                }

                var x = graph.transform.invertX(d3.event.layerX),
                    y = graph.transform.invertY(d3.event.layerY);

                if (graph.selection) {
                    graph.selection = assign(graph.selection, {x2: x, y2: y});
                }

                var subject = this.simulation.find(x, y, 20);
                if (subject === undefined) {
                    graph.tooltip = null;
                } else if (!graph.tooltip || graph.tooltip.node !== subject) {
                    graph.tooltip = {node: subject, x: x, y: y};
                    this.onmousemove(subject);
                }
            },
            dragstarted: function () {
                this.graph.selection = null;
                this.graph.tooltip = null;

                var x = d3.event.x,
                    y = d3.event.y;

                d3.event.subject.fx = x;
                d3.event.subject.fy = y;

                if (!d3.event.active) {this.simulation.alphaTarget(0.3).restart();}
            },
            dragged: function () {
                var x = d3.event.x,
                    y = d3.event.y;

                d3.event.subject.fx = (x);
                d3.event.subject.fy = (y);
            },
            dragended: function () {
                d3.event.subject.fx = null;
                d3.event.subject.fy = null;

                if (!d3.event.active) {this.simulation.alphaTarget(0);}
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

    componentDidMount() {
        const { network } = this;
        const { dispatch } = this.props;

        network.dispatch = dispatch;
        network.onmouseclick = this.onMouseClick.bind(this);
        network.onmousemove = this.onMouseMove.bind(this);

        network.setup(this.refs.canvas);
    }

    onMouseClick(node) {
        const { dispatch } = this.props;
        dispatch(selectNode({node: node}));
    }

    onMouseMove(node) {
        //const { dispatch } = this.props;
        //dispatch(selectNode({node: node}));
    }

    onMouseOver(node) {
        //const { dispatch } = this.props;
        //dispatch(selectNode({node: node}));
    }

    componentWillReceiveProps(nextProps) {
    }

    componentDidUpdate(prevProps, prevState) {
        const { network } = this;
        const { fields } = this.props;

        // todo(nl5887): only when adding or removing new nodes
        if (prevProps.nodes !== this.props.nodes) {
            network.updateNodes({
                nodes: this.props.nodes,
                links: this.props.links,
                queries: this.props.queries,
            });
        }

        network.select(this.props.node);
        network.highlight(this.props.highlight_nodes);
    }

    shouldComponentUpdate(){
        return true;
    }

    render() {
        const { containerHeight, containerWidth } = this.props;

        return (
            <canvas
                style={{fontFamily: 'fontAwesome'}}
                width={containerWidth}
                height={containerHeight}
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
        nodes: state.entries.nodes,
        links: state.entries.links,
        queries: state.entries.searches,
        fields: state.entries.fields,
        items: state.entries.items,
        highlight_nodes: state.entries.highlight_nodes,
    };
};

export default connect(select)(Dimensions()(Graph));
