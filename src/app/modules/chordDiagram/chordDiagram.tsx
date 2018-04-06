import * as React from 'react';
import * as d3 from 'd3';
import {connect} from "react-redux";
import {Node} from "../../interfaces/node";
import {Link} from "../../interfaces/link";
import {
    getLinksForDisplay,
    getNodesForDisplay, getSelectedNodes
} from "../../reducers/entriesSelectors";
import {Item} from "../../interfaces/item";
import {Selection} from "d3-selection";
import {EventEmitter} from "fbemitter";
import * as styles from './chordDiagram.scss';
import {AppState} from "../../interfaces/appState";
import {getNodeHierarchy} from "../../helpers/getNodeHierarchy";

interface Props {
    nodes: Node[];
    links: Link[];
    items: Item[];
    onPaneEvent?: EventEmitter;
}

interface State {
}

class ChordDiagram extends React.Component<Props, State> {
    readonly maxNodes: number = 100;
    link: Selection<any, any, any, any>;
    node: Selection<any, any, any, any>;
    line: d3.RadialLine<any>;
    svg: Selection<any, any, any, any>;
    svgContainer: HTMLDivElement;

    renderDiagram(nodes: Node[], links: Link[]) {
        if (nodes.length > this.maxNodes) {
            return;
        }

        // Clear previous data
        d3.select("#svgContainer > *").remove();

        if (nodes.length === 0) {
            return;
        }

        const rect = this.svgContainer.getBoundingClientRect();
        const diameter = Math.min(rect.width, rect.height);
        const radius = diameter / 2;
        const innerRadius = radius - 120;

        this.line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.85))
            .radius(function(d: any) { return d.y; })
            .angle(function(d: any) { return d.x / 180 * Math.PI; });

        this.svg = d3.select("#svgContainer")
            .append("svg")
            .attr("width", rect.width)
            .attr("height", rect.height)
            .append("g")
            .attr("transform", "translate(" + (rect.width / 2) + "," + (rect.height / 2) + ")");

        this.link = this.svg.append("g").selectAll(".link");
        this.node = this.svg.append("g").selectAll(".node");

        const hierarchy = getNodeHierarchy(nodes, links);
        const root = d3.hierarchy(hierarchy).sum(d => d.size);

        const cluster = d3.cluster()
            .size([360, innerRadius]);

        cluster(root);

        this.link = this.link
            .data(this.packageImports(root.leaves()))
            .enter()
            .append("path")
            .each(function(d: any) { d.source = d[0], d.target = d[d.length - 1]; })
            .attr("class", "link")
            .attr("d", this.line)
            .attr('stroke-width', (d) => this.getThickness(links, d.source.data.id, d.target.data.id));

        this.node = this.node
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("class", "node")
            .attr("dy", "0.31em")
            .attr("transform", function(d: any) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
            .attr("text-anchor", function(d: any) { return d.x < 180 ? "start" : "end"; })
            .text(function(d: any) { return d.data.name; })
            .on("mouseover", this.mouseovered.bind(this))
            .on("mouseout", this.mouseouted.bind(this));
    }

    getThickness(links: Link[], source: string, target: string): number {
        const link = links.find(search =>
            (search.source === source && search.target === target)
            || (search.target === source && search.source === target)
        );

        return link.itemIds.length;
    }

    componentDidMount() {
        const { nodes, links, onPaneEvent } = this.props;

        this.renderDiagram(nodes, links);
        onPaneEvent.addListener('resized', this.onResized.bind(this));
    }

    componentWillUnmount() {
        const { onPaneEvent } = this.props;
        onPaneEvent.removeAllListeners();
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

    mouseovered(d) {
        this.node
            .each(function(n) { n.target = n.source = false; });

        this.link
            .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
            .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
            .filter(function(l) { return l.target === d || l.source === d; })
            .raise();

        this.node
            .classed("node--target", function(n) { return n.target; })
            .classed("node--source", function(n) { return n.source; });
    }

    mouseouted(d) {
        this.link
            .classed("link--target", false)
            .classed("link--source", false);

        this.node
            .classed("node--target", false)
            .classed("node--source", false);
    }

    packageImports(nodes) {
        var map = {},
            imports = [];

        // Compute a map from name to node.
        nodes.forEach(function(d) {
            map[d.data.id] = d;
        });

        // For each import, construct a link from the source to target node.
        nodes.forEach(function(d) {
            if (d.data.linksTo) d.data.linksTo.forEach(function(i) {
                imports.push(map[d.data.id].path(map[i]));
            });
        });

        return imports;
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
                    className={nodes.length > this.maxNodes ? 'hidden' : ''}
                    id="svgContainer"
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
        items: state.entries.items
    };
};

export default connect(select)(ChordDiagram);