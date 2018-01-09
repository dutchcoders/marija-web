import React, {Component} from 'react';
import { connect} from 'react-redux';
import Dimensions from 'react-dimensions';

import * as d3 from 'd3';
import { map, concat, without, clone, omit, groupBy, reduce, forEach, difference, find, uniq, remove, each, includes, assign, isEqual, isEqualWith, isEmpty } from 'lodash';
import moment from 'moment';

import { nodesSelect, highlightNodes, nodeSelect, deselectNodes } from '../../modules/graph/index';
import {normalize, fieldLocator, getArcParams} from '../../helpers/index';
import Loader from "../Misc/Loader";
import {Icon} from "../index";
import * as PIXI from 'pixi.js';
import MultiStyleText from 'pixi-multistyle-text';

const Worker = require("worker-loader!./Worker");
const nodeSprites = {};

class GraphPixi extends React.Component {
    constructor(props) {
        super(props);

        const worker = new Worker();

        this.state = {
            nodesFromWorker: [],
            nodeTextures: {},
            renderedNodesContainer: undefined,
            linksFromWorker: [],
            renderedLinks: undefined,
            renderedLinkLabels: undefined,
            selection: null,
            renderedSelection: undefined,
            renderer: undefined,
            renderedTooltip: undefined,
            renderedSelectedNodes: undefined,
            stage: undefined,
            worker: worker,
            renderedSinceLastTick: false,
            renderedSinceLastZoom: true,
            renderedSinceLastTooltip: false,
            renderedSinceLastSelection: false,
            renderedSinceLastSelectedNodes: false,
            transform: d3.zoomIdentity,
            shift: false,
            selecting: false
        };

        worker.onmessage = (event) => this.onWorkerMessage(event);
    }

    isMoving() {
        const { selecting } = this.state;

        return !selecting;
    }

    postWorkerMessage(message) {
        const { worker } = this.state;

        worker.postMessage(message);
    }

    onWorkerMessage(event) {
        switch (event.data.type) {
            case 'tick':
                this.onWorkerTick(event.data);
                break;
            case 'end':
                this.ended(event.data);
                break;
        }
    }

    onWorkerTick(data) {
        this.setState({
            nodesFromWorker: data.nodes,
            linksFromWorker: data.links,
            renderedSinceLastTick: false
        });
    }

    zoom(fraction, newX, newY) {
        const { renderedNodesContainer, renderedLinks, renderedSelectedNodes, renderedLinkLabels } = this.state;

        [renderedNodesContainer, renderedLinks, renderedSelectedNodes, renderedLinkLabels].forEach(zoomable => {
            zoomable.scale.x = fraction;
            zoomable.scale.y = fraction;

            if (typeof newX !== 'undefined') {
                zoomable.position.x = newX;
            }

            if (typeof newY !== 'undefined') {
                zoomable.position.y = newY;
            }
        });

        this.setState({
            renderedSinceLastZoom: false
        });
    }

    zoomed() {
        const transform = d3.event.transform;

        this.zoom(transform.k, transform.x, transform.y);

        this.setState({
            transform: transform,
        });
    }

    getQueryColors() {
        const { queries } = this.props;

        const queryColors = {};

        queries.forEach(query => {
            const hex = parseInt(query.color.replace('#', ''), 16);
            queryColors[query.q] = hex;
        });

        return queryColors;
    }

    getNodeTexture(node) {
        const { nodeTextures, renderer, queryColors } = this.state;
        const key = node.queries.join(';') + node.icon + node.r;
        let texture = nodeTextures[key];

        if (typeof texture !== 'undefined') {
            return texture;
        }

        const renderedNode = new PIXI.Container();

        const fractionPerQuery = 1 / node.queries.length;
        const anglePerQuery = 2 * Math.PI * fractionPerQuery;
        let currentAngle = .5 * Math.PI;

        node.queries.forEach((query, i) => {
            const graphics = new PIXI.Graphics();
            const color = queryColors[query];

            graphics.beginFill(color);
            graphics.moveTo(node.r, node.r);
            graphics.arc(node.r, node.r, node.r, currentAngle, currentAngle + anglePerQuery);
            renderedNode.addChild(graphics);

            currentAngle += anglePerQuery;
        });

        const icon = new PIXI.Text(node.icon, {
            fontSize: 14,
            fill: 0xffffff,
            textAlign: 'center',
            lineHeight: 10
        });

        icon.anchor.x = .5;
        icon.anchor.y = .5;
        icon.x = node.r;
        icon.y = node.r;

        renderedNode.addChild(icon);

        const size = node.r * 2;
        texture = PIXI.RenderTexture.create(size, size);
        renderer.render(renderedNode, texture);

        this.setState(prevState => ({
            nodeTextures: {
                ...prevState.nodeTextures,
                [key]: texture
            }
        }));

        return texture;
    }

    renderNodes() {
        const { renderedNodesContainer, nodesFromWorker } = this.state;

        renderedNodesContainer.removeChildren();

        nodesFromWorker.forEach(node => {
            const texture = this.getNodeTexture(node);
            const renderedNode = new PIXI.Sprite(texture);

            renderedNode.anchor.x = 0.5;
            renderedNode.anchor.y = 0.5;
            renderedNode.x = node.x;
            renderedNode.y = node.y;

            renderedNodesContainer.addChild(renderedNode);
        });
    }

    renderLinks() {
        const { linksFromWorker, renderedLinks, renderedLinkLabels } = this.state;

        renderedLinks.clear();
        renderedLinkLabels.removeChildren();
        renderedLinks.lineStyle(1, 0xFFFFFF);

        const linkCounter = {};

        linksFromWorker.forEach(link => {
            // When drawing a link, we need to know how many links there are between these 2 nodes
            const linksBetweenNodes = linksFromWorker
                .filter(loopLink =>
                    (
                        loopLink.source.id === link.source.id && loopLink.target.id === link.target.id
                        || loopLink.target.id === link.source.id && loopLink.source.id === link.target.id
                    )
                    && typeof loopLink.label !== 'undefined'
                )
                .length;

            let nthLink = 1;

            if (linksBetweenNodes > 1 && typeof link.label !== 'undefined') {
                const linkCounterKey = link.source.id + link.target.id;

                if (linkCounter[linkCounterKey]) {
                    linkCounter[linkCounterKey] += 1;
                } else {
                    linkCounter[linkCounterKey] = 1;
                }

                nthLink = linkCounter[linkCounterKey];
            }

            this.renderLink(link, nthLink, linksBetweenNodes);
        });
    }

    renderLink(link, nthLink, linksBetweenNodes) {
        if (linksBetweenNodes <= 1) {
            // When there's only 1 link between 2 nodes, we can draw a straight line

            this.renderStraightLine(
                link.source.x,
                link.source.y,
                link.target.x,
                link.target.y
            );

            if (link.label) {
                this.renderTextAlongStraightLine(
                    link.label,
                    link.source.x,
                    link.source.y,
                    link.target.x,
                    link.target.y
                );
            }
        } else {
            // When there are multiple links between 2 nodes, we need to draw arcs

            // Bend only increases per 2 new links
            let bend = (nthLink + (nthLink % 2)) / 15;

            // Every second link will be drawn on the bottom instead of the top
            if (nthLink % 2 === 0) {
                bend = bend * -1;
            }

            const {centerX, centerY, radius, startAngle, endAngle} =
                getArcParams(
                    link.source.x,
                    link.source.y,
                    link.target.x,
                    link.target.y,
                    bend
                );

            this.renderArc(centerX, centerY, radius, startAngle, endAngle, bend < 0);

            if (link.label) {
                const averageAngle = (startAngle + endAngle) / 2;

                this.renderTextAlongArc(link.label, centerX, centerY, radius, averageAngle, 2);
            }
        }
    }

    renderStraightLine(x1, y1, x2, y2) {
        const { renderedLinks } = this.state;

        renderedLinks.moveTo(x1, y1);
        renderedLinks.lineTo(x2, y2);
    }

    renderArc(centerX, centerY, radius, startAngle, endAngle, antiClockwise) {
        const { renderedLinks } = this.state;

        renderedLinks.arc(centerX, centerY, radius, startAngle, endAngle, antiClockwise);
    }

    renderTextAlongStraightLine(string, x1, y1, x2, y2) {
        const { renderedLinkLabels } = this.state;

        const averageX = (x1 + x2) / 2;
        const averageY = (y1 + y2) / 2;
        const deltaX = x1 - x2;
        const deltaY = y1 - y2;
        let angle = Math.atan2(deltaY, deltaX);
        const upsideDown = angle < -1.6 || angle > 1.6;

        // this.context.translate(averageX, averageY);

        const text = new PIXI.Text(string, {
            align: 'left',
            fontSize: 12,
            fill: '#ffffff'
        });

        text.anchor.set(0.5, 1);

        if (upsideDown) {
            angle += Math.PI;
        }

        text.setTransform(averageX, averageY, 1, 1, angle);

        renderedLinkLabels.addChild(text);
    }

    renderTextAlongArc(string, centerX, centerY, radius, angle, distanceFromArc) {
        if (typeof string !== 'string') {
            // typecast to string
            string += '';
        }

        return;

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
    }

    componentDidUpdate(prevProps) {
        const { nodes, links, highlight_nodes } = this.props;

        if (prevProps.nodes !== nodes) {
            const nodesToPost = [];

            nodes.forEach(node => {
                nodesToPost.push({
                    id: node.id,
                    count: node.count,
                    hash: node.hash,
                    queries: node.queries,
                    icon: node.icon
                });
            });

            const linksToPost = [];

            links.forEach(link => {
                linksToPost.push({
                    source: link.source,
                    target: link.target,
                    label: link.label
                });
            });

            const queryColors = this.getQueryColors();

            this.setState({ queryColors: queryColors }, () => {
                // The nodes can only be posted to the worker once the colors
                // are updated, otherwise we might run into a race condition
                // due to undefined colors while rendering

                this.postWorkerMessage({
                    type: 'update',
                    nodes: nodesToPost,
                    links: linksToPost
                });
            });
        }

        if (!isEqual(prevProps.highlight_nodes, highlight_nodes)) {
            this.setState({
                renderedSinceLastTooltip: false
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { nodes, itemsFetching, highlight_nodes, queries } = this.props;
        const { selecting } = this.state;

        return nextProps.nodes !== nodes
            || nextProps.itemsFetching !== itemsFetching
            || nextState.selecting !== selecting
            || !isEqual(nextProps.highlight_nodes, highlight_nodes)
            || !isEqual(nextProps.queries, queries);
    }

    renderSelection() {
        const { selection, renderedSelection, transform } = this.state;

        renderedSelection.clear();

        if (selection) {
            const x1 = transform.applyX(selection.x1);
            const x2 = transform.applyX(selection.x2);
            const y1 = transform.applyY(selection.y1);
            const y2 = transform.applyY(selection.y2);
            const width = x2 - x1;
            const height = y2 - y1;

            renderedSelection.beginFill(0xFFFFFF, .1);
            renderedSelection.drawRect(
                x1,
                y1,
                width,
                height
            );
            renderedSelection.endFill();
        }
    }

    renderTooltip() {
        const { renderedTooltip } = this.state;
        const { highlight_nodes } = this.props;

        renderedTooltip.removeChildren();

        if (isEmpty(highlight_nodes)) {
            return;
        }

        const tooltip = highlight_nodes[Object.keys(highlight_nodes)[0]];
        let text = '<heading>' + tooltip.query + "</heading>\n";

        forEach(tooltip.fields, (value, path) => {
            const isMain = tooltip.matchFields.indexOf(path) !== -1;

            if (isMain) {
                text += '<bold>';
            }

            text += path + ': ' + (value === null ? '' : value);

            if (isMain) {
                text += '</bold>';
            }

            text += "\n";
        });

        const styled = new MultiStyleText(text, {
            default: {
                fontFamily: 'Arial',
                fontSize: '14px',
                fill: '#000000',
                align: 'left'
            },
            bold: {
                fontStyle: 'bold',
            },
            heading: {
                fontSize: '18px',
            }
        });

        styled.x = tooltip.x + 5;
        styled.y = tooltip.y + 5;

        const background = new PIXI.Graphics();
        background.beginFill(0xFFFFFF, .8);
        background.drawRect(tooltip.x, tooltip.y, styled.width + 10, styled.height);

        renderedTooltip.addChild(background);
        renderedTooltip.addChild(styled);
    }

    /**
     * Draws a border around selected nodes
     */
    renderSelectedNodes() {
        const { selectedNodes } = this.props;
        const { nodesFromWorker, renderedSelectedNodes } = this.state;

        renderedSelectedNodes.clear();
        renderedSelectedNodes.lineStyle(1, 0xFFFFFF);

        selectedNodes.forEach(selected => {
            const nodeFromWorker = nodesFromWorker.find(search => search.hash === selected.hash);

            renderedSelectedNodes.drawCircle(nodeFromWorker.x, nodeFromWorker.y, nodeFromWorker.r);
        });

    }

    renderGraph() {
        const {
            renderedSinceLastTick,
            renderedSinceLastZoom,
            renderedSinceLastTooltip,
            renderedSinceLastSelectedNodes,
            renderer,
            stage,
            renderedSinceLastSelection
        } = this.state;

        const stateUpdates = {};

        if (!renderedSinceLastTick || !renderedSinceLastZoom) {
            this.renderNodes();
            this.renderLinks();

            stateUpdates.renderedSinceLastTick = true;
            stateUpdates.renderedSinceLastZoom = true;
        }

        if (!renderedSinceLastSelection) {
            this.renderSelection();

            stateUpdates.renderedSinceLastSelection = true;
        }

        if (!renderedSinceLastTooltip) {
            this.renderTooltip();

            stateUpdates.renderedSinceLastTooltip = true;
        }

        if (!renderedSinceLastSelectedNodes || !renderedSinceLastTick || !renderedSinceLastZoom) {
            this.renderSelectedNodes();

            stateUpdates.renderedSinceLastSelectedNodes = true;
        }

        if (!renderedSinceLastTooltip
            || !renderedSinceLastZoom
            || !renderedSinceLastTick
            || !renderedSinceLastSelection
            || !renderedSinceLastSelectedNodes) {
            renderer.render(stage);
            this.setState(stateUpdates);
        }

        requestAnimationFrame(() => this.renderGraph());
    }

    initGraph(width, height) {
        const renderer = PIXI.autoDetectRenderer({
            antialias: true,
            transparent: false,
            resolution: 1,
            width: width,
            height: height
        });

        renderer.backgroundColor = 0x3D4B5D;

        this.pixiContainer.appendChild(renderer.view);

        const stage = new PIXI.Container();

        const renderedLinks =  new PIXI.Graphics();
        stage.addChild(renderedLinks);

        const renderedLinkLabels =  new PIXI.Container();
        stage.addChild(renderedLinkLabels);

        const renderedNodesContainer = new PIXI.Container();
        stage.addChild(renderedNodesContainer);

        const renderedSelection = new PIXI.Graphics();
        stage.addChild(renderedSelection);

        const renderedSelectedNodes = new PIXI.Graphics();
        stage.addChild(renderedSelectedNodes);

        const renderedTooltip = new PIXI.Container();
        stage.addChild(renderedTooltip);


        const dragging = d3.drag()
            .filter(() => this.isMoving())
            .container(renderer.view)
            .subject(this.dragsubject.bind(this))
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this));

        const zooming = d3.zoom()
            .filter(() => this.isMoving())
            .scaleExtent([1 / 2, 8])
            .on("zoom", this.zoomed.bind(this));

        d3.select(renderer.view)
            .call(dragging)
            .call(zooming)
            .on('mousedown', this.onMouseDown.bind(this))
            .on('mousemove', this.onMouseMove.bind(this))
            .on('mouseup', this.onMouseUp.bind(this));

        this.setState({
            renderedNodesContainer: renderedNodesContainer,
            renderedLinks: renderedLinks,
            renderedSelection: renderedSelection,
            renderer: renderer,
            renderedTooltip: renderedTooltip,
            stage: stage,
            renderedLinkLabels: renderedLinkLabels,
            renderedSelectedNodes: renderedSelectedNodes
        }, () => this.renderGraph());
    }

    componentDidMount() {
        const { width, height } = this.pixiContainer.getBoundingClientRect();

        this.initGraph(width, height);

        this.postWorkerMessage({
            type: 'init',
            clientWidth: width,
            clientHeight: height
        });

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

    dragstarted() {
        const { transform } = this.state;

        const x = transform.invertX(d3.event.sourceEvent.layerX);
        const y = transform.invertY(d3.event.sourceEvent.layerY);

        d3.event.subject.fx = (x);
        d3.event.subject.fy = (y);

        this.postWorkerMessage({
            nodes: [d3.event.subject],
            type: 'restart'
        });
    }

    dragged() {
        const { transform } = this.state;

        const x = transform.invertX(d3.event.sourceEvent.layerX);
        const y = transform.invertY(d3.event.sourceEvent.layerY);

        d3.event.subject.fx = (x);
        d3.event.subject.fy = (y);

        this.postWorkerMessage({
            nodes: [d3.event.subject],
            type: 'restart'
        });
    }

    dragended() {
        this.postWorkerMessage({
            nodes: [d3.event.subject],
            type: 'stop'
        });
    }

    dragsubject() {
        const { transform } = this.state;

        const x = transform.invertX(d3.event.x);
        const y = transform.invertY(d3.event.y);

        return this.findNodeFromWorker(x, y);
    }

    findNodeFromWorker(x, y) {
        const { nodesFromWorker } = this.state;

        return nodesFromWorker.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            const d2 = dx * dx + dy * dy;

            return d2 < (node.r * node.r);
        });
    }

    findNode(x, y) {
        const nodeFromWorker = this.findNodeFromWorker(x, y);

        if (typeof nodeFromWorker === 'undefined') {
            return;
        }

        const { nodes } = this.props;

        return nodes.find(node => node.hash === nodeFromWorker.hash);
    }

    highlightNode(node) {
        const { highlight_nodes, dispatch } = this.props;
        const { nodesFromWorker, transform } = this.state;

        if ((typeof node === 'undefined' && isEmpty(highlight_nodes))
            || (typeof node !== 'undefined' && typeof highlight_nodes[node.hash] !== 'undefined')) {
            // nothing changed
            return;
        }

        let newHighlightNodes = {};

        if (typeof node !== 'undefined') {
            const nodeFromWorker = nodesFromWorker.find(search => search.hash === node.hash);

            newHighlightNodes = {
                [node.hash]: {
                    ...node,
                    x: transform.applyX(nodeFromWorker.x),
                    y: transform.applyY(nodeFromWorker.y)
                }
            };
        }

        dispatch(highlightNodes(newHighlightNodes));
    }

    selectNodes(nodes) {
        const { dispatch } = this.props;

        dispatch(nodesSelect(nodes));

        this.setState({ renderedSinceLastSelectedNodes: false });
    }

    /**
     * Handles selecting/deselecting nodes.
     * Is not involved with dragging nodes, d3 handles that.
     */
    onMouseDown(event) {
        const { selecting, shift, transform } = this.state;
        const { dispatch, selectedNodes, nodes } = this.props;

        if (!selecting) {
            return;
        }

        if (!shift) {
            dispatch(deselectNodes(selectedNodes));
        }

        const x = transform.invertX(d3.event.layerX);
        const y = transform.invertY(d3.event.layerY);
        const nodeFromWorker = this.findNodeFromWorker(x, y);

        if (nodeFromWorker) {
            const node = nodes.find(search => search.hash === nodeFromWorker.hash);
            const selectedNodesCopy = concat(selectedNodes, []);

            if (!includes(selectedNodes, node)) {
                selectedNodesCopy.push(node);
            } else {
                remove(selectedNodesCopy, node);
            }

            this.selectNodes(selectedNodesCopy);
        } else {
            const selection = {x1: x, y1: y, x2: x, y2: y};

            this.setState({ selection: selection });
        }
    }

    onMouseMove() {
        const { transform, selection, selecting } = this.state;

        const x = transform.invertX(d3.event.layerX);
        const y = transform.invertY(d3.event.layerY);

        if (selecting && selection) {
            const newSelection = assign({}, selection, {
                x2: x,
                y2: y
            });

            this.setState({
                renderedSinceLastSelection: false,
                selection: newSelection
            });
        }

        const tooltip = this.findNode(x, y);
        this.highlightNode(tooltip);
    }

    onMouseUp() {
        const { selection, nodesFromWorker } = this.state;
        const { nodes, selectedNodes } = this.props;

        if (!selection) {
            return;
        }

        const newSelectedNodes = concat(selectedNodes, []);

        nodesFromWorker.forEach(nodeFromWorker => {
            if ((nodeFromWorker.x > selection.x1 && nodeFromWorker.x < selection.x2) &&
                (nodeFromWorker.y > selection.y1 && nodeFromWorker.y < selection.y2)) {
                const node = nodes.find(search => search.hash === nodeFromWorker.hash);

                if (!includes(selectedNodes, node)) {
                    newSelectedNodes.push(node);
                }
            }

            if ((nodeFromWorker.x > selection.x2 && nodeFromWorker.x < selection.x1) &&
                (nodeFromWorker.y > selection.y2 && nodeFromWorker.y < selection.y1)) {
                const node = nodes.find(search => search.hash === nodeFromWorker.hash);

                if (!includes(selectedNodes, node)) {
                    newSelectedNodes.push(node);
                }
            }
        });

        this.selectNodes(newSelectedNodes);

        this.setState({
            selection: null,
            renderedSinceLastSelection: false
        });
    }

    handleKeyDown(event) {
        const altKey = 18;
        const shiftKey = 16;

        if (event.keyCode === altKey) {
            this.setState(prevstate => ({ selecting: !prevstate.selecting }));
        } else if (event.keyCode === shiftKey) {
            this.setState({ shift: true });
        }
    }

    handleKeyUp(event) {
        const shiftKey = 16;

        if (event.keyCode === shiftKey) {
            this.setState({ shift: false });
        }
    }

    enableSelecting() {
        this.setState({ selecting: true });
    }

    enableMoving() {
        this.setState({ selecting: false });
    }

    zoomIn() {
        this.zoom(1.1);
    }

    zoomOut() {
        this.zoom(.9);
    }

    render() {
        console.log('render');

        const { containerHeight, containerWidth, itemsFetching, nodes } = this.props;
        const { selecting } = this.state;

        return (
            <div className="graphComponent">
                <div className="graphContainer" ref={pixiContainer => this.pixiContainer = pixiContainer} />

                <ul className="mapControls">
                    <li className={!selecting ? 'active': ''}><Icon name="ion-arrow-move" onClick={this.enableMoving.bind(this)}/></li>
                    <li className={selecting ? 'active': ''}><Icon name="ion-ios-crop" onClick={this.enableSelecting.bind(this)}/></li>
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
        selectedNodes: state.entries.node,
        nodes: state.entries.nodes,
        links: state.entries.links,
        queries: state.entries.searches,
        fields: state.entries.fields,
        items: state.entries.items,
        highlight_nodes: state.entries.highlight_nodes,
        itemsFetching: state.entries.itemsFetching,
    };
};

export default connect(select)(Dimensions()(GraphPixi));
