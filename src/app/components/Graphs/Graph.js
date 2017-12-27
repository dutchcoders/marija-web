import React, {Component} from 'react';
import { connect} from 'react-redux';
import Dimensions from 'react-dimensions';

import * as d3 from 'd3';
import { map, clone, groupBy, reduce, forEach, difference, find, uniq, remove, each, includes, assign, isEqual, isEmpty } from 'lodash';
import moment from 'moment';

import { nodesSelect, highlightNodes, nodeSelect, deselectNodes } from '../../modules/graph/index';
import { normalize, fieldLocator } from '../../helpers/index';
import Loader from "../Misc/Loader";
import {Icon} from "../index";

var Worker = require("worker-loader!./Worker");

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
            },
            ticks: 0,
            selecting: false,
            moving: true,
            shift: false
        };

        const { containerHeight, containerWidth } = props;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        this.network = {
            fields: [],
            selecting: this.state.selecting,
            moving: this.state.moving,
            shift: this.state.shift,
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
                sizeRange: [15, 30]
            },
            zoomed: function () {
                this.graph.transform = d3.event.transform;
            },
            setup: function (el) {
                let { clientHeight, clientWidth } = el;

                this.render = this.render.bind(this);
                this.drawNode = this.drawNode.bind(this);
                this.drawLink = this.drawLink.bind(this);

                this.canvas = el;
                this.context = this.canvas.getContext('2d');
                var canvas = d3.select(this.canvas);

                this.graph.transform.x = clientWidth / 2;
                this.graph.transform.y = clientHeight / 2;

                canvas.on("mousedown", this.mousedown.bind(this))
                    .on("mousemove", this.mousemove.bind(this))
                    .on("mouseup", this.mouseup.bind(this))
                    .call(d3.drag()
                          .filter(() => {
                              return this.moving;
                          })
                          .subject(this.dragsubject.bind(this))
                          .on("start", this.dragstarted.bind(this))
                          .on("drag", this.dragged.bind(this))
                          .on("end", this.dragended.bind(this))
                         )
                    .call(d3.zoom()
                          .filter(() => {
                              return this.moving;
                          })
                          .scaleExtent([1 / 2, 8])
                          .on("zoom", this.zoomed.bind(this))
                         );

                let { height, width } = this.canvas;
                
                this.worker = new Worker();
                this.worker.onmessage = function(event) {
                    switch (event.data.type) {
                    case "tick":
                        return this.ticked(event.data);
                    case "end":
                        return this.ended(event.data);
                    }
                    return false;
                }.bind(this);
                
                this.worker.postMessage({
                    clientWidth: width,
                    clientHeight: height,
                    type: "init"
                });

                requestAnimationFrame(this.render);
            },
            ticked: function(data) {
                this.graph.nodes = data.nodes;
                this.graph.links = data.links;
            },
            select: function (nodes) {
                this.graph.selectedNodes = nodes;
            },
            highlight: function (nodes) {
                this.graph.highlight_nodes = nodes;
            },
            updateNodes: function (graph) {
                this.graph.queries = graph.queries;

                this.worker.postMessage({
                    nodes: graph.nodes,
                    links: graph.links,
                    type: "update"
                });

            },
            render: function () {
                if (!this.graph) {
                    return;
                }

                // only when there is activity?
                requestAnimationFrame(this.render);

                // optimizations to do:
                // * group alike drawings, prevent switching of colors, fonts, etc
                // * stroke and fill all at once
                // * don't draw out of the viewing context
                //

                const { canvas, context, graph, lines, fields } = this;

                // todo(nl5887): is this slow?
                const {width, height}  = canvas;

                context.save();
                context.clearRect(0, 0, width, height);

                context.translate((0) + graph.transform.x, (0) + graph.transform.y);

                context.scale(graph.transform.k, graph.transform.k);

                // draw links
                context.beginPath();

                // group all colors
                let color = lines.stroke.color;

                context.lineWidth = lines.stroke.thickness;

                const linkCounter = {};

                for (const link of graph.links) {
                    if (link.color !== color) {
                        context.strokeStyle = color;
                        context.stroke();

                        color = link.color;
                    }

                    const totalLinksBetweenNodes = graph.links
                        .filter(loopLink =>
                            loopLink.source === link.source && loopLink.target === link.target ||
                            loopLink.target === link.source && loopLink.source === link.target
                        )
                        .length;

                    // When there are more than 1 links between 2 nodes, we need to draw curved links
                    if (totalLinksBetweenNodes > 1) {
                        const linkCounterKey = link.source + link.target;

                        if (linkCounter[linkCounterKey]) {
                            linkCounter[linkCounterKey] += 1;
                        } else {
                            linkCounter[linkCounterKey] = 1;
                        }

                        this.drawCurvedLink(link, linkCounter[linkCounterKey], totalLinksBetweenNodes);
                    } else {
                        this.drawLink(link);
                    }
                }

                context.strokeStyle = color;
                context.stroke();

                // draw nodes
                for (let i = 0; i < graph.queries.length; i++) {
                    this.context.beginPath();

                    for (let j = 0; j < graph.nodes.length; j++) {
                        const d = graph.nodes[j];
                        this.drawNode(d, graph.queries[i]);
                    }

                    const color = graph.queries[i].color;

                    this.context.fillStyle = color;
                    this.context.fill();

                    this.context.strokeStyle = color;
                    this.context.stroke();
                }

                this.context.fillStyle = '#fff';

                for (let j = 0; j < graph.nodes.length; j++) {
                    const d = graph.nodes[j];
                    const fontHeight = 6 + Math.floor(0.8*d.r);
                    this.context.font= "italic " + fontHeight + "px Roboto, Helvetica, Arial";
                    this.context.textAlign = 'center';
                    this.context.fillText(d.icon, d.x, d.y + (fontHeight + 0.5)/2);
                    this.context.textAlign = 'left';
                }

                // todo(nl5887): we're having graph and react nodes here, go fix.
                if (this.graph.selectedNodes) {
                    this.context.strokeStyle = '#993833';
                    this.context.lineWidth = this.nodes.stroke.thickness;

                    this.context.beginPath();
                    for (const selectedNode of this.graph.selectedNodes) {
                        const d = find(this.graph.nodes, (n) => {
                            return n.id == selectedNode.id;
                        });

                        if (!d) 
                            continue;

                        this.context.moveTo(d.x + d.r, d.y);
                        this.context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
                    }
                    this.context.stroke();
                }

                if (graph.selection) {
                    context.beginPath();
                    context.strokeStyle = '#c0c0c0';
                    context.fillStyle = "rgba(224, 224, 224, 0.6)";
                    //context.fillStyle = '#eee';
                    context.lineWidth = 1;
                    // context.setLineDash([6]);

                    context.rect(graph.selection.x1, graph.selection.y1, graph.selection.x2 - graph.selection.x1, graph.selection.y2 - graph.selection.y1);
                    context.fill();
                    context.stroke();
                }

                // Display tooltip
                if (graph.highlight_nodes && graph.highlight_nodes.length > 0 && !isEmpty(graph.highlight_nodes[0].fields)) {
                    const tooltip = graph.highlight_nodes[0];

                    const lineHeight = 18;
                    const lines = Object.keys(tooltip.fields).length + 1;
                    const rectHeight = lineHeight * lines + 15;
                    const widths = [];

                    context.font = 'bold 14px Arial';

                    forEach(tooltip.fields, (value, path) => {
                        const {width} = context.measureText(path + ': ' + value);
                        widths.push(width);
                    });

                    const longestLine = widths.reduce((a, b) => Math.max(a, b));

                    context.beginPath();
                    context.lineWidth = '1';
                    context.strokeStyle = '#cecece';
                    context.fillStyle = '#fff';

                    context.rect(tooltip.x + 15, tooltip.y - 25, longestLine + 10, rectHeight);
                    context.stroke();
                    context.fill();

                    context.fillStyle = '#000';
                    let textY = tooltip.y - 5;
                    const textX = tooltip.x + 20;

                    context.font = '14px Arial';

                    context.fillText(tooltip.query, textX, textY);

                    context.beginPath();
                    context.moveTo(textX, textY + 7);
                    context.lineTo(textX + longestLine, textY + 7);
                    context.stroke();

                    textY += lineHeight + 5;

                    forEach(tooltip.fields, (value, path) => {
                        if (tooltip.matchFields.indexOf(path) !== -1) {
                            context.font = 'bold 14px Arial';
                        }

                        const text = path + ': ' + (value === null ? '' : value);

                        context.fillText(text, textX, textY);
                        textY += lineHeight;

                        context.font = '14px Arial';
                    });
                }

                context.restore();
            },
            drawCurvedLink: function (link, linkCounter, totalLinks) {
                // Bend only increases per 2 new links, and is proportional to the total number of links
                let bend = (linkCounter + (linkCounter % 2)) / (totalLinks * 10);

                // Every second link will be drawn on the bottom instead of the top
                if (linkCounter % 2 === 0) {
                    bend = bend * -1;
                }

                this.context.fillStyle = link.color;

                this.drawBend(
                    link.source.x,
                    link.source.y,
                    link.target.x,
                    link.target.y,
                    bend,
                    10,
                    10,
                    false,
                    false,
                    1,
                    1,
                    link.label
                );
            },
            drawLink: function(d) {
                this.context.moveTo(d.source.x, d.source.y);
                this.context.lineTo(d.target.x, d.target.y);
            },
            drawTextAlongArc: function (string, centerX, centerY, radius, angle, distanceFromArc) {
                this.context.save();
                this.context.translate(centerX, centerY);

                const characters = string.length;
                const stringWidth = this.context.measureText(string).width;
                const stringAngle = stringWidth / radius;
                const startAngle = angle + (Math.PI / 2) - (stringAngle / 2);
                const upsideDown = angle < Math.PI;

                this.context.rotate(startAngle);

                if (upsideDown) {
                    string = string.split('').reverse().join('');
                }

                for (let i = 0; i < characters; i ++) {
                    this.context.save();

                    const character = string[i];
                    const characterWidth = this.context.measureText(character).width;
                    const characterAngle = characterWidth / stringWidth * stringAngle;

                    let textY = -1 * radius;

                    if (upsideDown) {
                        textY += distanceFromArc;
                    } else {
                        textY -= distanceFromArc;
                    }

                    this.context.translate(0, textY);

                    if (upsideDown) {
                        this.context.translate(characterWidth / 2, 0);
                        this.context.rotate(-1 * Math.PI);
                        this.context.textAlign = 'center';
                    }

                    this.context.fillText(character, 0, 0, 10);
                    this.context.restore();
                    this.context.rotate(characterAngle);
                }

                this.context.restore();
            },

            drawBend: function (x1, y1, x2, y2, bend, aLen, aWidth, sArrow, eArrow, startRadius, endRadius, label) {
                const ctx = this.context;
                this.context.strokeStyle = 'grey';

                var mx, my, dist, nx, ny, x3, y3, cx, cy, radius, vx, vy, a1, a2;
                var arrowAng,aa1,aa2,b1;
                // find mid point
                mx = (x1 + x2) / 2;
                my = (y1 + y2) / 2;

                // get vector from start to end
                nx = x2 - x1;
                ny = y2 - y1;

                // find dist
                dist = Math.sqrt(nx * nx + ny * ny);

                // normalise vector
                nx /= dist;
                ny /= dist;

                // The next section has some optional behaviours
                // that set the dist from the line mid point to the arc mid point
                // You should only use one of the following sets

                //-- Uncomment for behaviour of arcs
                // This make the lines flatten at distance
                b1 =  (bend * 300) / Math.pow(dist,1/16);

                //-- Uncomment for behaviour of arcs
                // Arc bending amount close to constant
                // b1 =  bend * dist * 0.5

                // b1 = bend * dist

                // Arc amount bend more at dist
                x3 = mx + ny * b1;
                y3 = my - nx * b1;

                // get the radius
                radius = (0.5 * ((x1-x3) * (x1-x3) + (y1-y3) * (y1-y3)) / (b1));

                // use radius to get arc center
                cx = x3 - ny * radius;
                cy = y3 + nx * radius;

                // radius needs to be positive for the rest of the code
                radius = Math.abs(radius);




                // find angle from center to start and end
                a1 = Math.atan2(y1 - cy, x1 - cx);
                a2 = Math.atan2(y2 - cy, x2 - cx);

                // normalise angles
                a1 = (a1 + Math.PI * 2) % (Math.PI * 2);
                a2 = (a2 + Math.PI * 2) % (Math.PI * 2);
                // ensure angles are in correct directions
                if (bend < 0) {
                    if (a1 < a2) { a1 += Math.PI * 2 }
                } else {
                    if (a2 < a1) { a2 += Math.PI * 2 }
                }

                // convert arrow length to angular len
                arrowAng = aLen / radius  * Math.sign(bend);
                // get angular length of start and end circles and move arc start and ends

                a1 += startRadius / radius * Math.sign(bend);
                a2 -= endRadius / radius * Math.sign(bend);
                aa1 = a1;
                aa2 = a2;

                // check for too close and no room for arc
                if ((bend < 0 && a1 < a2) || (bend > 0 && a2 < a1)) {
                    return;
                }
                // is there a start arrow
                if (sArrow) { aa1 += arrowAng } // move arc start to inside arrow
                // is there an end arrow
                if (eArrow) { aa2 -= arrowAng } // move arc end to inside arrow

                // check for too close and remove arrows if so
                if ((bend < 0 && aa1 < aa2) || (bend > 0 && aa2 < aa1)) {
                    sArrow = false;
                    eArrow = false;
                    aa1 = a1;
                    aa2 = a2;
                }
                // draw arc
                ctx.beginPath();
                ctx.arc(cx, cy, radius, aa1, aa2, bend < 0);
                ctx.stroke();

                const averageAngle = (aa1 + aa2) / 2;

                this.drawTextAlongArc(label, cx, cy, radius, averageAngle, 2);

                ctx.beginPath();

                // draw start arrow if needed
                if(sArrow){
                    ctx.moveTo(
                        Math.cos(a1) * radius + cx,
                        Math.sin(a1) * radius + cy
                    );
                    ctx.lineTo(
                        Math.cos(aa1) * (radius + aWidth / 2) + cx,
                        Math.sin(aa1) * (radius + aWidth / 2) + cy
                    );
                    ctx.lineTo(
                        Math.cos(aa1) * (radius - aWidth / 2) + cx,
                        Math.sin(aa1) * (radius - aWidth / 2) + cy
                    );
                    ctx.closePath();
                }

                // draw end arrow if needed
                if(eArrow){
                    ctx.moveTo(
                        Math.cos(a2) * radius + cx,
                        Math.sin(a2) * radius + cy
                    );
                    ctx.lineTo(
                        Math.cos(aa2) * (radius - aWidth / 2) + cx,
                        Math.sin(aa2) * (radius - aWidth / 2) + cy
                    );
                    ctx.lineTo(
                        Math.cos(aa2) * (radius + aWidth / 2) + cx,
                        Math.sin(aa2) * (radius + aWidth / 2) + cy
                    );
                    ctx.closePath();
                }
                ctx.fill();
            },

            drawNode: function (d, q) {
                // this.context.moveTo(d.x + d.r, d.y);
                // for each different query, show a part. This will show that the edge
                //  has been found in multiple queries.
                // this can be optimized by combining all same color fills apart
                for (var i = 0; i < d.queries.length; i++) {
                    var j = i;
                    for (; j < d.queries.length; j++) {
                        if (d.queries[i] !== d.queries[j]) {
                            break;
                        }
                    }

                    if (q.q === d.queries[i]) {
                        this.context.moveTo(d.x, d.y);
                        this.context.arc(d.x, d.y, d.r, 2 * Math.PI * (i / d.queries.length), 2 * Math.PI * ( (j + 1) / d.queries.length));
                        this.context.lineTo(d.x, d.y);
                    }

                    i = j;
                }
            },
            find(x, y) {
                var i = 0,
                    n = this.graph.nodes.length,
                    dx,
                    dy,
                    d2,
                    node,
                    closest;

                let radius = 20;
                if (radius == null) 
                    radius = Infinity;
                else 
                    radius *= radius;

                for (i = 0; i < n; ++i) {
                    node = this.graph.nodes[i];
                    dx = x - node.x;
                    dy = y - node.y;
                    d2 = dx * dx + dy * dy;
                    if (d2 < (node.r * node.r)) closest = node;
                }

                return closest;
            },
            mousedown: function () {
                const { graph } = this;

                if (!this.selecting) {
                    return;
                }

                if (!this.shift) {
                    this.dispatch(deselectNodes(graph.selectedNodes));
                }

                var x = graph.transform.invertX(d3.event.layerX),
                    y = graph.transform.invertY(d3.event.layerY);

                var subject = this.find(x, y);
                if (!subject) {
                    graph.selection = {x1: x, y1: y, x2: x, y2: y};
                    this.onNodesSelect([]);
                    return;
                } else {
                    if (!includes(graph.selectedNodes, subject)) {
                        graph.selectedNodes.push(subject);
                    } else {
                        remove(graph.selectedNodes, subject);
                    }

                    this.onNodesSelect(graph.selectedNodes);
                }
            },
            mouseup: function () {
                const { graph } = this;

                if (!this.selecting) {
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

                    this.onNodesSelect(graph.selectedNodes);

                    graph.selection = null;
                }
            },
            mousemove: function (n) {
                const { graph } = this;

                var x = graph.transform.invertX(d3.event.layerX),
                    y = graph.transform.invertY(d3.event.layerY);

                if (graph.selection) {
                    graph.selection = assign(graph.selection, {x2: x, y2: y});
                }

                var subject = this.find(x, y);
                if (subject === undefined) {
                    graph.tooltip = null;
                    this.onHighlightNode([]);
                } else if (!graph.tooltip || graph.tooltip.node !== subject) {
                    graph.tooltip = {node: subject, x: x, y: y};
                    this.onmousemove(subject);
                    this.onHighlightNode([subject]);
                }
            },
            dragstarted: function () {
                const { graph, simulation } = this;

                graph.selection = null;
                graph.tooltip = null;

                var x = graph.transform.invertX(d3.event.sourceEvent.layerX),
                    y = graph.transform.invertY(d3.event.sourceEvent.layerY);

                d3.event.subject.fx = (x);
                d3.event.subject.fy = (y);

                this.worker.postMessage({
                    nodes: [d3.event.subject],
                    type: 'restart'
                });
            },
            dragged: function () {
                const { graph, simulation } = this;

                var x = graph.transform.invertX(d3.event.sourceEvent.layerX),
                    y = graph.transform.invertY(d3.event.sourceEvent.layerY);

                d3.event.subject.fx = (x);
                d3.event.subject.fy = (y);

                this.worker.postMessage({
                    nodes: [d3.event.subject],
                    type: 'restart'
                });
            },
            dragended: function () {
                const { graph, simulation } = this;

                this.worker.postMessage({
                    nodes: [d3.event.subject],
                    type: 'stop'
                });
            },
            dragsubject: function () {
                const { graph, simulation } = this;

                const x = graph.transform.invertX(d3.event.x),
                      y = graph.transform.invertY(d3.event.y);

                return this.find(x, y);
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
        network.onHighlightNode = this.onHighlightNode.bind(this);
        network.onNodesSelect = this.onNodesSelect.bind(this);

        network.setup(this.refs.canvas);
    }

    onMouseClick(node) {
        const { dispatch } = this.props;
        dispatch(nodeSelect({node: node}));
    }

    onHighlightNode(nodes) {
        // todo(nl5887): dispatch actual react (this.props.nodes, not graph nodes)
        if (isEqual(nodes, this.props.highlight_nodes)) {
            return;
        }

        const { dispatch } = this.props;

        dispatch(highlightNodes(nodes));
    }

    onNodesSelect(nodes) {
        // todo(nl5887): dispatch actual react (this.props.nodes, not graph nodes)
        const { dispatch } = this.props;
        dispatch(nodesSelect(nodes));
    }

    onMouseMove(node) {
        //const { dispatch } = this.props;
        //dispatch(nodeSelect({node: node}));
    }

    onMouseOver(node) {
        //const { dispatch } = this.props;
        //dispatch(nodeSelect({node: node}));
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
                queries: this.props.queries
            });
        }

        // todo(nl5887): we're having graph and react nodes here, go fix.
        network.select(this.props.node);

        network.highlight(this.props.highlight_nodes);
    }

    shouldComponentUpdate(){
        // todo(nl5887): not always update, only on changes
        return true;
    }

    zoomIn() {
        this.network.graph.transform.k = this.network.graph.transform.k * 1.1;
    }

    zoomOut() {
        this.network.graph.transform.k = this.network.graph.transform.k * 0.9;
    }

    enableSelect() {
        this.setState({
            selecting: true,
            moving: false
        });

        this.network.selecting = true;
        this.network.moving = false;
    }

    enableMove() {
        this.setState({
            selecting: false,
            moving: true
        });

        this.network.selecting = false;
        this.network.moving = true;
    }

    handleKeyDown(event) {
        const { selecting } = this.state;
        const altKey = 18;
        const shiftKey = 16;

        if (event.keyCode === altKey) {
            if (selecting) {
                this.enableMove();
            } else {
                this.enableSelect();
            }
        } else if (event.keyCode === shiftKey) {
            this.setState({shift: true});
            this.network.shift = true;
        }
    }

    handleKeyUp(event) {
        const shiftKey = 16;

        if (event.keyCode === shiftKey) {
            this.setState({shift: false});
            this.network.shift = false;
        }
    }

    render() {
        const { containerHeight, containerWidth, itemsFetching } = this.props;
        const { selecting, moving } = this.state;

        return (
            <div>
                <canvas
                    style={{fontFamily: 'glyphicons halflings'}}
                    className={'graph ' + (selecting ? 'selecting' : 'moving')}
                    width={containerWidth}
                    height={containerHeight}
                    ref="canvas">
                        histogram
                </canvas>
                <ul className="mapControls">
                    <li className={moving ? 'active': ''}><Icon name="ion-arrow-move" onClick={this.enableMove.bind(this)}/></li>
                    <li className={selecting ? 'active': ''}><Icon name="ion-ios-crop" onClick={this.enableSelect.bind(this)}/></li>
                    <li><Icon name="ion-ios-minus" onClick={this.zoomOut.bind(this)}/></li>
                    <li><Icon name="ion-ios-plus" onClick={this.zoomIn.bind(this)}/></li>
                </ul>
                <Loader show={itemsFetching} classes={['graphLoader']}/>
            </div>
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
        itemsFetching: state.entries.itemsFetching,
    };
};

export default connect(select)(Dimensions()(Graph));
