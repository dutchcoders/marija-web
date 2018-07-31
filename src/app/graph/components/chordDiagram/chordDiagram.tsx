import * as React from 'react';
import * as d3 from 'd3';
import {connect, Dispatch} from 'react-redux';
import {Node} from '../../interfaces/node';
import {Link} from '../../interfaces/link';
import {
    getLinksForDisplay,
    getNodesForDisplay, getSelectedNodes
} from '../../graphSelectors';
import {Item} from '../../interfaces/item';
import {Selection} from 'd3-selection';
import {EventEmitter} from 'fbemitter';
import * as styles from './chordDiagram.scss';
import {AppState} from '../../../main/interfaces/appState';
import {getNodeHierarchy} from '../../helpers/getNodeHierarchy';
import {Search} from "../../../search/interfaces/search";
import {deselectNodes} from "../../graphActions";

interface Props {
    nodes: Node[];
    links: Link[];
    items: Item[];
    onPaneEvent?: EventEmitter;
    searches: Search[];
    dispatch: Dispatch<any>;
}

interface State {
}

class ChordDiagram extends React.Component<Props, State> {
    readonly maxNodes: number = 100;
    link: Selection<any, any, any, any>;
    node: Selection<any, any, any, any>;
    line: d3.RadialLine<any>;
    svg: any;
    svgContainer: HTMLDivElement;
    transform: any = d3.zoomIdentity;
    renderedTransform: boolean = true;
    mounted: boolean = false;

    renderDiagram(nodes: Node[], links: Link[]) {
        const { searches } = this.props;

        if (nodes.length > this.maxNodes) {
            return;
        }

        // Clear previous data
        d3.select('#svgContainer > *').remove();

        if (nodes.length === 0) {
            return;
        }

        const rect = this.svgContainer.getBoundingClientRect();
        const diameter = Math.min(rect.width, rect.height);
        const radius = diameter / 2;
        const innerRadius = radius - 120;

        this.line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.85))
            .radius((node: any) => node.y )
            .angle((node: any) => node.x / 180 * Math.PI);

        this.svg = d3.select('#svgContainer')
            .append('svg')
            .attr('width', rect.width)
            .attr('height', rect.height);

        const stage = this.svg.append('g').attr('class', 'stage');

        const centerStage = stage.append('g')
            .attr('transform', 'translate(' + (rect.width / 2) + ',' + (rect.height / 2) + ')');

        this.link = centerStage.append('g').selectAll('.link');
        this.node = centerStage.append('g').selectAll('.node');

        const hierarchy = getNodeHierarchy(nodes, links);
        const root = d3.hierarchy(hierarchy).sum(d => d.size);

        const cluster = d3.cluster()
            .size([360, innerRadius]);

        cluster(root);

        this.link = this.link
            .data(this.getPaths(root.leaves()))
            .enter()
            .append('path')
            .each(function(d: any) { d.source = d[0], d.target = d[d.length - 1]; })
            .attr('class', 'link ' + styles.link)
            .attr('d', this.line)
            .attr('stroke-width', (d) => this.getThickness(links, d.source.data.id, d.target.data.id));

        const searchColors = {};
        searches.forEach(search => searchColors[search.searchId] = search.color);

        this.node = this.node
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('class', 'node ' + styles.node)
            .attr('dy', '0.31em')
            .attr('transform', (node: any) => 'rotate(' + (node.x - 90) + ')translate(' + (node.y + 8) + ',0)' + (node.x < 180 ? '' : 'rotate(180)'))
            .attr('text-anchor', (node: any) => node.x < 180 ? 'start' : 'end')
            .attr('fill', node => searchColors[node.data.searchIds[0]])
            .on('mouseover', this.mouseovered.bind(this))
            .on('mouseout', this.mouseouted.bind(this));

        this.node
            .append('text')
            .attr('dx', node => node.x < 180 ? 15 : -15)
            .text(node => node.data.name);

        this.node
            .append('text')
            .attr('dy', '2px')
            .attr('class', styles.close)
            .text(node => '\uF405')
            .on('click', node => this.close(node));

        const zooming = d3.zoom()
            .scaleExtent([.3, 3])
            .on("zoom", this.zoomed.bind(this));

        d3.select('#svgContainer > svg').call(zooming);
    }

    zoomed() {
        this.transform = d3.event.transform;
        this.renderedTransform = false;
    }


    renderZoom() {
        d3.select('#svgContainer .stage')
            .attr('transform', this.transform);
    }

    ticker() {
        if (!this.mounted) {
            return;
        }

        if (!this.renderedTransform) {
            this.renderZoom();
            this.renderedTransform = true;
        }

        requestAnimationFrame(() => this.ticker());
    }

    close(node) {
        const { dispatch } = this.props;

        dispatch(deselectNodes([node.data]));
    }

    getThickness(links: Link[], source: number, target: number): number {
        const link = links.find(search =>
            (search.source === source && search.target === target)
            || (search.target === source && search.source === target)
        );

        return 1;
    }

    componentDidMount() {
        const { nodes, links, onPaneEvent } = this.props;

        this.renderDiagram(nodes, links);
        onPaneEvent.addListener('resized', this.onResized.bind(this));

        this.mounted = true;
        requestAnimationFrame(() => this.ticker());
    }

    componentWillUnmount() {
        const { onPaneEvent } = this.props;
        onPaneEvent.removeAllListeners();
        this.mounted = false;
    }

    onResized() {
        const { nodes, links } = this.props;

        this.renderDiagram(nodes, links);
    }

    componentWillReceiveProps(nextProps: Props) {
        const { nodes } = this.props;

        if (nextProps.nodes.length !== nodes.length) {
            this.renderDiagram(nextProps.nodes, nextProps.links);
        }
    }

    mouseovered(hoveredNode) {
        // Reset
        this.link.classed(styles.activeLink, false);
        this.node.classed(styles.activeNode, false);
        this.node.each(node => node.active = false);

        this.link
            .classed(styles.activeLink, link => {
                const active = link.target === hoveredNode || link.source === hoveredNode;

                if (active) {
                    link.target.active = active;
                    link.source.active = active;
                }

                return active;
            })
            .filter(link =>
                link.target === hoveredNode || link.source === hoveredNode
            )
            .raise();

        this.node
            .classed(styles.activeNode, node => node.active);
    }

    mouseouted(d) {
        this.link.classed(styles.activeLink, false);
        this.node.classed(styles.activeNode, false);
    }

    getPaths(nodes) {
        const map = {};
        const paths = [];

        // Compute a map from name to node.
        nodes.forEach(node => map[node.data.id] = node);

        // For each node, construct a link from the source to target node.
        nodes.forEach(node => {
            if (!node.data.linksTo) {
                return;
            }

            node.data.linksTo.forEach(linkedNode => {
                const path = map[node.data.id].path(map[linkedNode]);

                paths.push(path);
            });
        });

        return paths;
    }

    render() {
        const { nodes } = this.props;

        let tooManyNodes = null;
        let selectNodes = null;

        if (nodes.length > this.maxNodes) {
            tooManyNodes = (
                <p>
                    You have selected {nodes.length} nodes, but the maximum
                    for the chord diagram is {this.maxNodes}. Deselect some
                    nodes to continue.
                </p>
            );
        } else if (nodes.length === 0) {
            selectNodes = (
                <p>Select some nodes to display their chord diagram.</p>
            );
        }

        return (
            <div className={styles.chordDiagram}>
                {tooManyNodes}
                {selectNodes}
                <div
                    className={styles.svgContainer + (nodes.length > this.maxNodes ? ' hidden' : '')}
                    id='svgContainer'
                    ref={svgContainer => this.svgContainer = svgContainer}
                />
            </div>
        );
    }
}

const select = (state: AppState) => {
    return {
        nodes: getSelectedNodes(state),
        links: getLinksForDisplay(state),
        items: state.graph.items,
        searches: state.graph.searches
    };
};

export default connect(select)(ChordDiagram);