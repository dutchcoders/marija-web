import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import * as d3 from 'd3';
import { concat, debounce, remove, includes, assign, isEqual, isEmpty, isEqualWith } from 'lodash';
import {
    nodesSelect, highlightNodes, deselectNodes, showTooltip,
    setSelectingMode, clearSelection
} from '../../modules/graph/actions';
import { getArcParams, getDirectlyRelatedNodes } from '../../helpers/index.js';
import * as PIXI from 'pixi.js';
import {Search} from "../../interfaces/search";
import {Node} from "../../interfaces/node";
import {Link} from "../../interfaces/link";
import {NodeFromD3} from "../../interfaces/nodeFromD3";
import {LinkFromD3} from "../../interfaces/linkFromD3";
import {
    hideContextMenu,
    showContextMenu
} from "../../modules/contextMenu/contextMenuActions";
import {
    getLinksForDisplay,
    getNodesForDisplay
} from "../../reducers/entriesSelectors";
import {setFps} from "../../modules/stats/statsActions";
import {Field} from "../../interfaces/field";
import {getArrowPosition} from "../../helpers/getArrowPosition";
import {AppState} from "../../interfaces/appState";
const myWorker = require("worker-loader!./d3Worker");

interface TextureMap {
    [hash: string]: PIXI.RenderTexture;
}

interface Props {
    selectingMode: boolean;
    searches: Search[];
    nodesForDisplay: Node[];
    linksForDisplay: Link[];
    fields: Field[];
    zoomEvents: any;
    dispatch: Dispatch<any>;
    version: string;
    showLabels: boolean;
}

interface State {
}

interface RenderedSince {
    lastTick: boolean;
    lastZoom: boolean;
    lastTooltip: boolean;
    lastSelection: boolean;
    lastSelectedNodes: boolean;
    lastQueries: boolean;
    lastHighlights: boolean;
    lastFields: boolean;
    lastNodeLableToggle: boolean;
}

class Graph extends React.PureComponent<Props, State> {
    pixiContainer: HTMLElement;
    state: State = {};
    renderedSince: RenderedSince = {
        lastTick: true,
        lastZoom: true,
        lastTooltip: true,
        lastSelection: true,
        lastSelectedNodes: true,
        lastQueries: true,
        lastHighlights: true,
        lastFields: true,
        lastNodeLableToggle: true
    };
    nodesFromD3: NodeFromD3[] = [];
    nodeTextures: TextureMap = {};
    renderedNodesContainer: PIXI.Container = new PIXI.Container();
    linksFromD3: LinkFromD3[] = [];
    renderedLinks: PIXI.Graphics = new PIXI.Graphics();
    renderedLinkLabels: PIXI.Container = new PIXI.Container();
    renderedArrows: PIXI.Container = new PIXI.Container();
    arrowTexture: PIXI.RenderTexture;
    selection: any;
    renderedSelection: PIXI.Graphics = new PIXI.Graphics();
    renderer: PIXI.WebGLRenderer;
    renderedTooltip: PIXI.Container = new PIXI.Graphics();
    renderedSelectedNodes: PIXI.Container = new PIXI.Graphics();
    selectedNodeTextures: TextureMap = {};
    highlightTextures: TextureMap = {};
    renderedHighlights: PIXI.Container = new PIXI.Container();
    nodeLabelTextures: TextureMap = {};
    renderedNodeLabels: PIXI.Container = new PIXI.Container();
    iconTextures: TextureMap = {};
    renderedIcons: PIXI.Container = new PIXI.Container();
    stage: PIXI.Container = new PIXI.Container();
    worker: Worker;
    transform: any = d3.zoomIdentity;
    shift: boolean;
    lastLoopTimestamp: number;
    frameTime: number = 0;
    lastDispatchedFpsTimestamp: number = 0;
    linkLabelTextures: TextureMap = {};
    tooltipTextures: TextureMap = {};
    dragSubjects: NodeFromD3[];

    isMoving() {
        const { selectingMode } = this.props;

        return !selectingMode;
    }

    postWorkerMessage(message) {
        this.worker.postMessage(message);
    }

    onWorkerMessage(event) {
        switch (event.data.type) {
            case 'tick':
                this.onWorkerTick(event.data);
                break;
            case 'end':
                // this.ended(event.data);
                break;
        }
    }

    onWorkerTick(data) {
        data.nodes.forEach(node => {
            node.textureKey = this.getNodeTextureKey(node);
        });

        this.nodesFromD3 = data.nodes;
        this.linksFromD3 = data.links;
        this.renderedSince.lastTick = false;
    }

    createArrowTexture() {
        const width = 15;
        const height = 15;
        const sharpness = 8;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.moveTo(0, 0);
        ctx.lineTo(width, sharpness);
        ctx.lineTo(sharpness, height);
        ctx.fill();

        this.arrowTexture = PIXI.Texture.fromCanvas(canvas) as PIXI.RenderTexture;
    }

    zoom(fraction: number, newX: number, newY: number) {
        [
            this.renderedNodesContainer,
            this.renderedLinks,
            this.renderedSelectedNodes,
            this.renderedLinkLabels,
            this.renderedHighlights,
            this.renderedNodeLabels,
            this.renderedArrows,
            this.renderedIcons
        ].forEach(zoomable => {
            zoomable.scale.x = fraction;
            zoomable.scale.y = fraction;

            if (typeof newX !== 'undefined') {
                zoomable.position.x = newX;
            }

            if (typeof newY !== 'undefined') {
                zoomable.position.y = newY;
            }
        });

        this.renderedSince.lastZoom = false;
    }

    zoomed() {
        const transform = d3.event.transform;

        this.zoom(transform.k, transform.x, transform.y);

        this.transform = transform;
    }

    getSearchColor(searchId: string) {
        const { searches } = this.props;
        const search = searches.find(search => search.searchId === searchId);

        if (typeof search !== 'undefined') {
            return search.color;
        }
    }

    getNodeTextureKey(node: NodeFromD3) {
        return node.icon
            + node.r
            + node.searchIds.map(searchId => this.getSearchColor(searchId)).join('');
    }

    getNodeTexture(node: NodeFromD3) {
        let texture = this.nodeTextures[node.textureKey];

        if (typeof texture !== 'undefined') {
            // Get from cache
            return texture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = node.r * 2;
        canvas.height = node.r * 2;
        const ctx = canvas.getContext('2d');

        const fractionPerSearch = 1 / node.searchIds.length;
        const anglePerSearch = 2 * Math.PI * fractionPerSearch;
        let currentAngle = .5 * Math.PI;

        node.searchIds.forEach(searchId => {
            ctx.beginPath();
            ctx.fillStyle = this.getSearchColor(searchId);
            ctx.moveTo(node.r, node.r);
            ctx.arc(node.r, node.r, node.r, currentAngle, currentAngle + anglePerSearch);
            ctx.fill();

            currentAngle += anglePerSearch;
        });

        const fontSize = node.r;

        ctx.fillStyle = '#ffffff';
        ctx.font = fontSize + 'px Ionicons, Roboto, Helvetica, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.icon, node.r - 1, node.r + (fontSize / 3));

        texture = PIXI.Texture.fromCanvas(canvas) as PIXI.RenderTexture;

        // Save in cache
        this.nodeTextures[node.textureKey] = texture;

        return texture;
    }

    getIconTexture(icon: string): PIXI.RenderTexture {
        let texture: PIXI.RenderTexture = this.iconTextures[icon];

        if (texture) {
            // Get from cache
            return texture;
        }

        const style = new PIXI.TextStyle({
            fontSize: 18,
            fontFamily: 'Ionicons',
            fill: 0xfac04b,
            dropShadow: true,
            dropShadowDistance: 1,
            dropShadowBlur: 3,
            dropShadowAlpha: .7
        });

        const text = new PIXI.Text(icon, style);
        const metrics = PIXI.TextMetrics.measureText(icon, style);

        texture = PIXI.RenderTexture.create(metrics.width, metrics.height);
        this.renderer.render(text, texture);

        // Save in cache
        this.iconTextures[icon] = texture;

        return texture;
    }

    renderNodes() {
        this.renderedNodesContainer.removeChildren();
        this.renderedIcons.removeChildren();

        this.nodesFromD3.forEach(node => {
            const texture = this.getNodeTexture(node);
            const renderedNode = new PIXI.Sprite(texture);

            renderedNode.anchor.x = 0.5;
            renderedNode.anchor.y = 0.5;
            renderedNode.x = node.x;
            renderedNode.y = node.y;

            this.renderedNodesContainer.addChild(renderedNode);
            this.renderIcons(node);
        });
    }

    renderIcons(node: NodeFromD3) {
        if (node.important) {
            const star = '\uF24E';
            const warning = '\uF100';
            const texture = this.getIconTexture(warning);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = node.x + node.r - sprite.width + 5;
            sprite.y = node.y - node.r - 5;

            this.renderedIcons.addChild(sprite);
        }
    }

    renderLinks() {
        this.renderedLinks.clear();
        this.renderedLinkLabels.removeChildren();
        this.renderedArrows.removeChildren();

        this.linksFromD3.forEach(link => {
            this.renderedLinks.lineStyle(link.thickness, 0xFFFFFF);
            this.renderLink(link);
        });
    }

    renderArrow(x: number, y: number, angle: number) {
        const sprite = new PIXI.Sprite(this.arrowTexture);
        const offset = 15;

        sprite.x = x + Math.cos(angle) * offset;
        sprite.y = y + Math.sin(angle) * offset;
        sprite.rotation = angle - .79;

        this.renderedArrows.addChild(sprite);
    }

    renderArrow2(x: number, y: number, angle: number) {
        const sprite = new PIXI.Sprite(this.arrowTexture);
        sprite.x = x;
        sprite.y = y;
        sprite.rotation = angle - .79;

        this.renderedArrows.addChild(sprite);
    }

    renderLink(link: LinkFromD3) {
        if (link.total <= 1) {
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

                const deltaX = link.source.x - link.target.x;
                const deltaY = link.source.y - link.target.y;
                const angle = Math.atan2(deltaY, deltaX);

                this.renderArrow(link.target.x, link.target.y, angle);
            }
        } else {
            // When there are multiple links between 2 nodes, we need to draw arcs

            // Bend only increases per 2 new links
            let bend = (link.current + (link.current % 2)) / 15;

            // Every second link will be drawn on the bottom instead of the top
            if (link.current % 2 === 0) {
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

            const normalizedEndAngle = (endAngle + Math.PI * 2) % (Math.PI * 2);
            const counterClockwise = bend < 0;
            const arrowPosition = getArrowPosition(centerX, centerY, radius, normalizedEndAngle, counterClockwise, link.target.x, link.target.y);

            this.renderArrow2(arrowPosition.x, arrowPosition.y, arrowPosition.angle);
            this.renderArc(centerX, centerY, radius, startAngle, endAngle, counterClockwise);

            if (link.label) {
                const averageAngle = (startAngle + endAngle) / 2;

                this.renderTextAlongArc(link.label, centerX, centerY, radius, averageAngle, 7);
            }
        }
    }

    renderStraightLine(x1: number, y1: number, x2: number, y2: number) {
        this.renderedLinks.moveTo(x1, y1);
        this.renderedLinks.lineTo(x2, y2);
    }

    renderArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, antiClockwise: boolean) {
        const xStart = centerX + radius * Math.cos(startAngle);
        const yStart = centerY + radius * Math.sin(startAngle);

        this.renderedLinks.moveTo(xStart, yStart);
        this.renderedLinks.arc(centerX, centerY, radius, startAngle, endAngle, antiClockwise);
    }

    renderTextAlongStraightLine(string: string, x1: number, y1: number, x2: number, y2: number) {
        const texture = this.getLinkLabelTexture(string);
        const text = new PIXI.Sprite(texture);
        const averageX = (x1 + x2) / 2;
        const averageY = (y1 + y2) / 2;
        const deltaX = x1 - x2;
        const deltaY = y1 - y2;
        let angle = Math.atan2(deltaY, deltaX);
        const upsideDown = angle < -1.6 || angle > 1.6;

        text.anchor.set(0.5, 1);

        if (upsideDown) {
            angle += Math.PI;
        }

        text.setTransform(averageX, averageY, 1, 1, angle);

        this.renderedLinkLabels.addChild(text);
    }

    getLinkLabelTexture(label: string) {
        let texture = this.linkLabelTextures[label];

        if (typeof texture !== 'undefined') {
            // Get from cache
            return texture;
        }

        const style = new PIXI.TextStyle({
            fontSize: 14,
            fill: 0xffffff
        });

        const text = new PIXI.Text(label, style);
        const metrics = PIXI.TextMetrics.measureText(label, style);

        texture = PIXI.RenderTexture.create(metrics.width, metrics.height);
        this.renderer.render(text, texture);

        // Save in cache
        this.linkLabelTextures[label] = texture;

        return texture;
    }

    getRopeCoordinates(startAngle: number, endAngle: number, radius: number) {
        const num = 10;
        const perIteration = (endAngle - startAngle) / num;
        let currentAngle = startAngle;
        const coordinates = [];

        while ((currentAngle - .0001) < endAngle) {
            const x = radius * Math.cos(currentAngle);
            const y = radius * Math.sin(currentAngle);

            coordinates.push(new PIXI.Point(x, y));

            currentAngle += perIteration;
        }

        return coordinates;
    }

    renderTextAlongArc(string: any, centerX: number, centerY: number, radius: number, angle: number, distanceFromArc: number) {
        radius += distanceFromArc;

        if (typeof string !== 'string') {
            // typecast to string
            string += '';
        }

        const texture = this.getLinkLabelTexture(string);
        const totalAngle = texture.width / radius;
        const coordinates = this.getRopeCoordinates(angle - totalAngle / 2, angle + totalAngle / 2, radius);
        const rope = new PIXI.mesh.Rope(texture, coordinates);

        rope.x = centerX;
        rope.y = centerY;

        this.renderedLinkLabels.addChild(rope);
    }

    getSelectedNodes() {
        const { nodesForDisplay } = this.props;

        return nodesForDisplay.filter(node => node.selected);
    }

    shouldPostToWorker(prevNodes: Node[], nextNodes: Node[], prevLinks: Link[], nextLinks: Link[]): boolean {
        return prevNodes.length !== nextNodes.length
            || prevLinks.length !== nextLinks.length;

        // Todo: make this more intelligent than only looking at array length
        // Can the graph also change when properties of the nodes change?
    }

    getTooltipNodes(): Node[] {
        const { nodesForDisplay } = this.props;

        return nodesForDisplay.filter(node => node.displayTooltip);
    }

    getHighlightNodes(): Node[] {
        const { nodesForDisplay } = this.props;

        return nodesForDisplay.filter(node => node.highlighted);
    }

    shouldUpdateNodeProperties(nodes: Node[], nextNodes: Node[]): boolean {
        if (nodes.length !== nextNodes.length) {
            // If we have a different amount of nodes we dont update just some
            // properties, we update the whole node array
            return false;
        }

        for (let i = 0; i < nodes.length; i ++) {
            if (nodes[i].important !== nextNodes[i].important) {
                return true;
            }
        }

        return false;
    }

    updateNodeProperties(nextNodes: Node[]) {
        const nodesToPost = nextNodes.map(node => {
            return {
                id: node.id,
                important: node.important
            }
        });

        this.postWorkerMessage({
            type: 'updateNodeProperties',
            nodes: nodesToPost
        });
    }

    componentWillReceiveProps(nextProps: Props) {
        const { searches, nodesForDisplay, linksForDisplay, fields, showLabels } = this.props;
        const selectedNodes = this.getSelectedNodes();
        const nextSelected = nextProps.nodesForDisplay.filter(node => node.selected);

        if (!isEqual(nextSelected, selectedNodes)) {
            this.renderedSince.lastSelectedNodes = false;
        }

        if (nextProps.nodesForDisplay.filter(node => node.displayTooltip) !== this.getTooltipNodes()) {
            this.renderedSince.lastTooltip = false;
        }

        if (!isEqual(nextProps.searches, searches)) {
            this.nodeTextures = {};
            this.renderedSince.lastQueries = false;
        }

        if (!isEqual(nextProps.fields, fields)) {
            this.nodesFromD3.forEach(nodeFromD3 => {
                const node = nextProps.nodesForDisplay.find(search => search.id === nodeFromD3.id);

                if (!node) {
                    return;
                }

                nodeFromD3.icon = node.icon;
                nodeFromD3.textureKey = this.getNodeTextureKey(nodeFromD3);
            });

            this.nodeTextures = {};
            this.renderedSince.lastFields = false;
        }

        if (this.shouldPostToWorker(nextProps.nodesForDisplay, nodesForDisplay, nextProps.linksForDisplay, linksForDisplay)) {
            this.postNodesAndLinksToWorker(nextProps.nodesForDisplay, nextProps.linksForDisplay);
        } else if (this.shouldUpdateNodeProperties(nodesForDisplay, nextProps.nodesForDisplay)) {
            this.updateNodeProperties(nextProps.nodesForDisplay);
        }

        if (nextProps.nodesForDisplay.filter(node => node.highlighted) !== this.getHighlightNodes()) {
            this.renderedSince.lastHighlights = false;
        }

        if (nextProps.showLabels !== showLabels) {
            this.renderedSince.lastNodeLableToggle = false;
        }
    }

    postNodesAndLinksToWorker(nodesForDisplay: Node[], linksForDisplay: Link[]) {
        const maxLabelLength = 20;

        const nodesToPost = nodesForDisplay.map(node => {
            let label = node.abbreviated;

            if (label.length > maxLabelLength) {
                label = label.substring(0, maxLabelLength) + '...';
            }

            return {
                id: node.id,
                count: node.count,
                hash: node.hash,
                searchIds: node.searchIds,
                icon: node.icon,
                label: label,
                important: node.important
            };
        });

        const linksToPost = linksForDisplay.map(link => {
            let thickness: number = 1;

            if (link.itemIds.length > 1) {
                thickness = Math.min(link.itemIds.length, 15);
            }

            return {
                source: link.source,
                target: link.target,
                label: link.label,
                total: link.total,
                current: link.current,
                thickness: thickness
            };
        });

        this.postWorkerMessage({
            type: 'update',
            nodes: nodesToPost,
            links: linksToPost
        });
    }

    renderSelection() {
        this.renderedSelection.clear();

        if (this.selection) {
            const x1 = this.transform.applyX(this.selection.x1);
            const x2 = this.transform.applyX(this.selection.x2);
            const y1 = this.transform.applyY(this.selection.y1);
            const y2 = this.transform.applyY(this.selection.y2);
            const width = x2 - x1;
            const height = y2 - y1;

            this.renderedSelection.beginFill(0xFFFFFF, .1);
            this.renderedSelection.drawRect(
                x1,
                y1,
                width,
                height
            );
            this.renderedSelection.endFill();
        }
    }

    getSearches(searchIds: string[]): Search[] {
        const { searches } = this.props;

        return searches.filter(search =>
            searchIds.indexOf(search.searchId) !== -1
        );
    }

    getTooltipTexture(node: Node) {
        const key = node.name + node.fields.join('');
        let texture = this.tooltipTextures[key];

        if (typeof texture !== 'undefined') {
            // Get from cache
            return texture;
        }

        const container = new PIXI.Container();
        const searches = this.getSearches(node.searchIds);

        const queries: string[] = searches.map(search => search.q);
        const datasources: string[] = searches.reduce((accumulator, search) =>
            accumulator.concat(search.datasources)
        , []);

        const description =
            node.fields.join(', ') + ': ' + node.abbreviated + "\n"
            + 'Queries: ' + queries.join(', ') + "\n"
            + 'Datasources: ' + datasources.join(', ');

        const text = new PIXI.Text(description, {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#ffffff'
        });

        text.x = 10;
        text.y = 5;

        const backgroundWidth = text.width + 20;
        const backgroundHeight = text.height + 10;
        const background = new PIXI.Graphics();
        background.beginFill(0x35394d, 1);
        background.lineStyle(1, 0x323447, 1);
        background.drawRoundedRect(0, 0, backgroundWidth, backgroundHeight, 14);

        container.addChild(background);
        container.addChild(text);

        texture = PIXI.RenderTexture.create(backgroundWidth, backgroundHeight);
        this.renderer.render(container, texture);

        // Save in cache
        this.tooltipTextures[key] = texture;

        return texture;
    }

    renderTooltip() {
        const tooltipNodes = this.getTooltipNodes();

        this.renderedTooltip.removeChildren();

        if (tooltipNodes.length === 0) {
            return;
        }

        tooltipNodes.forEach(node => {
            const nodeFromD3 = this.nodesFromD3.find(search => search.hash === node.hash);

            if (typeof nodeFromD3 === 'undefined') {
                return;
            }

            const texture = this.getTooltipTexture(node);
            const sprite = new PIXI.Sprite(texture);

            sprite.x = this.transform.applyX(nodeFromD3.x);
            sprite.y = this.transform.applyY(nodeFromD3.y);

            this.renderedTooltip.addChild(sprite);
        });
    }

    getSelectedNodeTexture(radius: number) {
        let texture = this.selectedNodeTextures[radius];

        if (texture) {
            // Get from cache
            return texture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = radius * 2 + 4;
        canvas.height = radius * 2 + 4;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fac04b';
        ctx.arc(radius + 2, radius + 2, radius, 0, 2 * Math.PI);
        ctx.stroke();

        texture = PIXI.Texture.fromCanvas(canvas) as PIXI.RenderTexture;

        // Save in cache
        this.selectedNodeTextures[radius] = texture;

        return texture;
    }

    /**
     * Draws a border around selected nodes
     */
    renderSelectedNodes() {
        const selectedNodes = this.getSelectedNodes();

        this.renderedSelectedNodes.removeChildren();

        selectedNodes.forEach(selected => {
            const nodeFromD3 = this.nodesFromD3.find(search => search.hash === selected.hash);

            if (typeof nodeFromD3 === 'undefined') {
                return;
            }

            const texture = this.getSelectedNodeTexture(nodeFromD3.r);
            const sprite = new PIXI.Sprite(texture);

            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            sprite.x = nodeFromD3.x;
            sprite.y = nodeFromD3.y;

            this.renderedSelectedNodes.addChild(sprite);
        });
    }

    getHighlightTexture(radius: number) {
        radius += 5;
        let texture = this.highlightTextures[radius];

        if (texture) {
            // Get from cache
            return texture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = radius * 2;
        canvas.height = radius * 2;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
        ctx.fill();

        texture = PIXI.Texture.fromCanvas(canvas) as PIXI.RenderTexture;

        // Save in cache
        this.highlightTextures[radius] = texture;

        return texture;
    }

    renderHighlights() {
        const highlightNodes = this.getHighlightNodes();

        this.renderedHighlights.removeChildren();

        highlightNodes.forEach((highlightNode: Node) => {
            const nodeFromD3 = this.nodesFromD3.find(node => node.hash === highlightNode.hash);

            if (typeof nodeFromD3 === 'undefined') {
                return;
            }

            const texture = this.getHighlightTexture(nodeFromD3.r);
            const sprite = new PIXI.Sprite(texture);

            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            sprite.x = nodeFromD3.x;
            sprite.y = nodeFromD3.y;

            this.renderedHighlights.addChild(sprite);
        });
    }

    getNodeLabelTexture(label: string): PIXI.Texture {
        const key = label;
        let texture = this.nodeLabelTextures[key];

        if (typeof texture !== 'undefined') {
            // Get from cache
            return texture;
        }

        const text = new PIXI.Text(label, {
            fontFamily: 'Arial',
            fontSize: '12px',
            fill: '#ffffff',
            dropShadow: true,
            dropShadowDistance: 1,
            dropShadowBlur: 3,
            dropShadowAlpha: .7
        });

        texture = PIXI.RenderTexture.create(text.width, text.height);
        this.renderer.render(text, texture);

        // Save in cache
        this.nodeLabelTextures[key] = texture;

        return texture;
    }

    renderNodeLabels() {
        const { showLabels } = this.props;

        this.renderedNodeLabels.removeChildren();

        const tooSmallToRead: boolean = this.transform.k < .75;

        if (!showLabels || tooSmallToRead) {
            return;
        }

        this.nodesFromD3.forEach(node => {
            const texture = this.getNodeLabelTexture(node.label);
            const sprite = new PIXI.Sprite(texture);

            sprite.x = node.x - (texture.width / 2);
            sprite.y = node.y + node.r;

            this.renderedNodeLabels.addChild(sprite);
        });
    }

    renderGraph(renderStage: boolean) {
        if (renderStage) {
            this.renderer.render(this.stage);
        }

        const shouldRender = (key) => {
            return !this.renderedSince[key];
        };

        const stateUpdates: any = {};

        if (shouldRender('lastTick')
            || shouldRender('lastZoom')
            || shouldRender('lastQueries')
            || shouldRender('lastFields')) {
            this.renderNodes();
            this.renderLinks();
            this.renderTooltip();
            this.renderNodeLabels();

            stateUpdates.lastTick = true;
            stateUpdates.lastZoom = true;
            stateUpdates.lastQueries = true;
            stateUpdates.lastNodeLableToggle = true;
        }

        if (shouldRender('lastNodeLableToggle')) {
            this.renderNodeLabels();

            stateUpdates.lastNodeLableToggle = true;
        }

        if (shouldRender('lastSelection')) {
            this.renderSelection();

            stateUpdates.lastSelection = true;
        }

        if (shouldRender('lastTooltip')) {
            this.renderTooltip();

            stateUpdates.lastTooltip = true;
        }

        if (shouldRender('lastSelectedNodes')
            || shouldRender('lastTick')
            || shouldRender('lastZoom')) {
            this.renderSelectedNodes();

            stateUpdates.lastSelectedNodes = true;
        }

        if (shouldRender('lastHighlights')
            || shouldRender('lastZoom')
            || shouldRender('lastTick')) {
            this.renderHighlights();

            stateUpdates.lastHighlights = true;
        }

        const hasStateUpdates: boolean = !isEmpty(stateUpdates);

        if (hasStateUpdates) {
            Object.assign(this.renderedSince, stateUpdates);
        }

        this.measureFps();

        requestAnimationFrame(() => this.renderGraph(hasStateUpdates));
    }

    measureFps() {
        const { dispatch } = this.props;

        if (!this.lastLoopTimestamp) {
            this.lastLoopTimestamp = Date.now() - 16000;
        }

        const filterStrength = 10;
        const thisLoopTimestamp = Date.now();
        const thisFrameTime = thisLoopTimestamp - this.lastLoopTimestamp;

        this.frameTime = this.frameTime + (thisFrameTime - this.frameTime) / filterStrength;
        this.lastLoopTimestamp = thisLoopTimestamp;

        const msSinceDispatched: number = Date.now() - this.lastDispatchedFpsTimestamp;
        const twoSeconds = 2000;

        if (msSinceDispatched > twoSeconds) {
            const fps: number = 1000 / this.frameTime;

            dispatch(setFps(fps));
            this.lastDispatchedFpsTimestamp = Date.now();
        }
    }

    initGraph() {
        const { width, height } = this.pixiContainer.getBoundingClientRect();

        this.renderer = new PIXI.WebGLRenderer({
            antialias: true,
            transparent: false,
            resolution: 1,
            width: width,
            height: height
        });

        this.renderer.backgroundColor = 0x3D4B5D;
        this.renderer.render(this.stage);

        this.pixiContainer.appendChild(this.renderer.view);

        this.stage.addChild(this.renderedLinks);
        this.stage.addChild(this.renderedLinkLabels);
        this.stage.addChild(this.renderedHighlights);
        this.stage.addChild(this.renderedNodesContainer);
        this.stage.addChild(this.renderedSelection);
        this.stage.addChild(this.renderedSelectedNodes);
        this.stage.addChild(this.renderedNodeLabels);
        this.stage.addChild(this.renderedArrows);
        this.stage.addChild(this.renderedIcons);
        this.stage.addChild(this.renderedTooltip);

        const dragging = d3.drag()
            .filter(() => this.isMoving())
            .container(this.renderer.view)
            .subject(this.dragsubject.bind(this))
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this));

        const zooming = d3.zoom()
            .filter(() => this.isMoving())
            .scaleExtent([.3, 3])
            .on("zoom", this.zoomed.bind(this));

        d3.select(this.renderer.view)
            .call(dragging)
            .call(zooming)
            .on('mousedown', this.onMouseDown.bind(this))
            .on('mousemove', this.onMouseMove.bind(this))
            .on('mouseup', this.onMouseUp.bind(this));

        this.renderGraph(false);
    }

    initWorker() {
        const { width, height } = this.pixiContainer.getBoundingClientRect();
        const { nodesForDisplay, linksForDisplay } = this.props;
        this.worker = new myWorker();
        this.worker.onmessage = (event) => this.onWorkerMessage(event);

        this.postWorkerMessage({
            type: 'init',
            clientWidth: width,
            clientHeight: height
        });

        this.postNodesAndLinksToWorker(nodesForDisplay, linksForDisplay);
    }

    componentDidMount() {
        const { zoomEvents } = this.props;

        this.createArrowTexture();
        this.initWorker();
        this.initGraph();

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        zoomEvents.addListener('zoomIn', this.zoomIn.bind(this));
        zoomEvents.addListener('zoomOut', this.zoomOut.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        window.removeEventListener('resize', this.handleWindowResize.bind(this));
    }

    handleWindowResize = debounce(() => {
        const { width, height } = this.pixiContainer.getBoundingClientRect();

        this.renderer.resize(width, height);

        this.renderedSince.lastZoom = false;
    }, 500);

    setDragSubjects() {
        const { nodesForDisplay } = this.props;

        const selected = nodesForDisplay.filter(node => node.selected);

        const subjects: NodeFromD3[] = [];
        const mainSubject: NodeFromD3 = d3.event.subject;

        selected.forEach(node => {
            if (node.id === mainSubject.id) {
                return;
            }

            const nodeFromD3 = this.nodesFromD3.find(search => search.hash === node.hash);
            subjects.push(nodeFromD3);
        });

        this.dragSubjects = subjects;
    }

    dragstarted() {
        this.setDragSubjects();

        // Remove the tooltip
        this.tooltipNode(undefined);
    }

    dragged() {
        const x = this.transform.invertX(d3.event.sourceEvent.layerX);
        const y = this.transform.invertY(d3.event.sourceEvent.layerY);

        // If there is suddenly a large change in x and y position,
        // the cursor is probably outside of the graph area. Cancel dragging.
        if (Math.abs(x - d3.event.subject.fx) > 500
            || Math.abs(y - d3.event.subject.fy) > 500) {
            this.dragended();
            return;
        }

        const mainSubject: NodeFromD3 = d3.event.subject;
        mainSubject.fx = x;
        mainSubject.fy = y;

        let subjects: NodeFromD3[] = [mainSubject];

        if (this.dragSubjects) {
            const deltaX = x - mainSubject.x;
            const deltaY = y - mainSubject.y;

            this.dragSubjects.forEach(subject => {
                subject.fx = subject.x + deltaX;
                subject.fy = subject.y + deltaY;
            });

            subjects = subjects.concat(this.dragSubjects);
        }

        this.postWorkerMessage({
            nodes: subjects,
            type: 'restart'
        });
    }

    dragended() {
        this.dragSubjects = undefined;

        this.postWorkerMessage({
            nodes: [d3.event.subject],
            type: 'stop'
        });
    }

    dragsubject() {
        const { nodesForDisplay } = this.props;

        const selectedNodes = nodesForDisplay.filter(node => node.selected);
        const nodeMap = {};
        selectedNodes.forEach(node => nodeMap[node.id] = node);

        const x = this.transform.invertX(d3.event.x);
        const y = this.transform.invertY(d3.event.y);

        const nodeFromD3 = this.findNodeFromD3(x, y);


        return this.findNodeFromD3(x, y);
    }

    findNodeFromD3(x: number, y: number): NodeFromD3 {
        return this.nodesFromD3.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            const d2 = dx * dx + dy * dy;

            return d2 < (node.r * node.r);
        });
    }

    findNode(x, y): Node {
        const nodeFromD3 = this.findNodeFromD3(x, y);

        if (typeof nodeFromD3 === 'undefined') {
            return;
        }

        const { nodesForDisplay } = this.props;

        return nodesForDisplay.find(node => node.hash === nodeFromD3.hash);
    }

    tooltipNode(node: Node) {
        const { dispatch } = this.props;
        const tooltipNodes = this.getTooltipNodes();

        if (typeof node === 'undefined' && !isEmpty(tooltipNodes)) {
            dispatch(showTooltip([]));
            return;
        }

        if (typeof node !== 'undefined') {
            const current = tooltipNodes.find(search => search.hash === node.hash);

            if (typeof current === 'undefined') {
                dispatch(showTooltip([node]));
            }
        }
    }

    selectNodes(nodes: Node[]) {
        const { dispatch } = this.props;

        dispatch(nodesSelect(nodes));
        this.renderedSince.lastSelectedNodes = false;
    }

    /**
     * Handles selecting/deselecting nodes.
     * Is not involved with dragging nodes, d3 handles that.
     */
    onMouseDown() {
        const { dispatch, selectingMode } = this.props;

        if (!selectingMode) {
            return;
        }

        const x = this.transform.invertX(d3.event.layerX);
        const y = this.transform.invertY(d3.event.layerY);
        const node = this.findNode(x, y);

        if (node) {
            if (node.selected) {
                dispatch(deselectNodes([node]));
            } else {
                dispatch(nodesSelect([node]));
            }
        } else {
            this.selection = {x1: x, y1: y, x2: x, y2: y};

            if (!this.shift) {
                dispatch(clearSelection());
            }
        }
    }

    onMouseMove() {
        const { selectingMode, dispatch, nodesForDisplay, linksForDisplay } = this.props;
        const tooltipNodes = this.getTooltipNodes();

        const x = this.transform.invertX(d3.event.layerX);
        const y = this.transform.invertY(d3.event.layerY);

        if (selectingMode && this.selection) {
            this.selection.x2 = x;
            this.selection.y2 = y;
            this.renderedSince.lastSelection = false;
        }

        const tooltip = this.findNode(x, y);

        if (tooltipNodes[0] === tooltip) {
            // Nothing changed
            return;
        }

        this.tooltipNode(tooltip);
        let related = [];

        if (tooltip) {
            related = getDirectlyRelatedNodes([tooltip], nodesForDisplay, linksForDisplay);
        }

        dispatch(highlightNodes(related));
    }

    onMouseUp() {
        const { nodesForDisplay } = this.props;
        const selectedNodes = this.getSelectedNodes();

        if (!this.selection) {
            return;
        }

        const newSelectedNodes = concat(selectedNodes, []);

        this.nodesFromD3.forEach(nodeFromD3 => {
            if ((nodeFromD3.x > this.selection.x1 && nodeFromD3.x < this.selection.x2) &&
                (nodeFromD3.y > this.selection.y1 && nodeFromD3.y < this.selection.y2)) {
                const node = nodesForDisplay.find(search => search.hash === nodeFromD3.hash);

                if (!includes(selectedNodes, node)) {
                    newSelectedNodes.push(node);
                }
            }

            if ((nodeFromD3.x > this.selection.x2 && nodeFromD3.x < this.selection.x1) &&
                (nodeFromD3.y > this.selection.y2 && nodeFromD3.y < this.selection.y1)) {
                const node = nodesForDisplay.find(search => search.hash === nodeFromD3.hash);

                if (!includes(selectedNodes, node)) {
                    newSelectedNodes.push(node);
                }
            }
        });

        this.selectNodes(newSelectedNodes);

        this.selection = null;
        this.renderedSince.lastSelection = false;
    }

    handleKeyDown(event: KeyboardEvent) {
        const { dispatch } = this.props;
        const shiftKey = 16;
        const mKey = 77;
        const sKey = 83;

        if (event.keyCode === mKey) {
            // Switch to move mode
            dispatch(setSelectingMode(false));
        } else if (event.keyCode === sKey) {
            // Switch to selecting mode
            dispatch(setSelectingMode(true));
        } else if (event.keyCode === shiftKey) {
            this.shift = true;
        }
    }

    handleKeyUp(event) {
        const shiftKey = 16;

        if (event.keyCode === shiftKey) {
            this.shift = false;
        }
    }

    zoomIn() {
        const newK = this.transform.k * 1.3;

        if (newK > 3) {
            return;
        }

        this.transform.k = newK;

        this.zoom(this.transform.k, undefined, undefined);
    }

    zoomOut() {
        const newK = this.transform.k * .7;

        if (newK < .3) {
            return;
        }

        this.transform.k = newK;

        this.zoom(this.transform.k, undefined, undefined);
    }

    onContextMenu(event) {
        const { dispatch } = this.props;

        event.preventDefault();

        const rect: ClientRect = this.pixiContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const transformedX = this.transform.invertX(x);
        const transformedY = this.transform.invertY(y);
        const node = this.findNode(transformedX, transformedY);

        if (node) {
            dispatch(showContextMenu(node.id, x, y));

            // Hide tooltip, because it looks weird to have both active at the
            // same time
            dispatch(showTooltip([]));
        }
    }

    hideContextMenu() {
        const { dispatch } = this.props;
        dispatch(hideContextMenu());
    }

    render() {
        return (
            <div className="graphComponent">
                <div
                    className="graphContainer"
                    ref={pixiContainer => this.pixiContainer = pixiContainer}
                    onContextMenu={this.onContextMenu.bind(this)}
                    onClick={this.hideContextMenu.bind(this)}
                />
            </div>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        nodesForDisplay: getNodesForDisplay(state),
        linksForDisplay: getLinksForDisplay(state),
        fields: state.entries.fields,
        searches: state.entries.searches,
        selectingMode: state.entries.selectingMode,
        showLabels: state.entries.showLabels
    };
};

export default connect(select)(Graph);
