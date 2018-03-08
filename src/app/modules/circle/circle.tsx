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

interface Props {
    nodes: Node[];
    links: Link[];
    items: Item[];
}

interface State {
}

class Circle extends React.Component<Props, State> {
    cluster;
    link;
    node;
    line;
    svg;

    componentDidMount() {
        var diameter = 560,
            radius = diameter / 2,
            innerRadius = radius - 120;

        this.cluster = d3.cluster()
            .size([360, innerRadius]);

        this.line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.85))
            .radius(function(d: any) { return d.y; })
            .angle(function(d: any) { return d.x / 180 * Math.PI; });

        this.svg = d3.select("#svgContainer")
            .append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
            .attr("transform", "translate(" + radius + "," + radius + ")");

        this.link = this.svg.append("g").selectAll(".link");
        this.node = this.svg.append("g").selectAll(".node");
    }

    componentWillReceiveProps(nextProps: Props) {
        if (!nextProps.nodes.length) {
            return;
        }

        console.log(nextProps.nodes);

        const items = this.buildData(nextProps.nodes, nextProps.links);

        var root = this.packageHierarchy(items)
            .sum(function(d) { return d.size; });

        console.log(root);

        this.cluster(root);

        this.link = this.link
            .data(this.packageImports(root.leaves()));

        this.link = this.link
            .enter().append("path")
            .each(function(d: any) { d.source = d[0], d.target = d[d.length - 1]; })
            .attr("class", "link")
            .attr("d", this.line);

        this.node = this.node
            .data(root.leaves())
            .enter().append("text")
            .attr("class", "node")
            .attr("dy", "0.31em")
            .attr("transform", function(d: any) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
            .attr("text-anchor", function(d: any) { return d.x < 180 ? "start" : "end"; })
            .text(function(d: any) { console.log(d.data.key); return d.data.key; })
            .on("mouseover", this.mouseovered.bind(this))
            .on("mouseout", this.mouseouted.bind(this));
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


    updateNodes(name, value) {
        return function (d) {
            if (value) this.parentNode.appendChild(this);
            this.svg.select("#node-" + d[name].key).classed(name, value);
        };
    }

    packageHierarchy(items) {
        var map = {};

        const find = (id, data?) => {
            var node = map[id], i;
            if (!node) {
                node = map[id] = data || {id: id, children: []};
                if (id && id.length) {
                    node.parent = find(id.substring(0, i = id.lastIndexOf(".")));
                    node.parent.children.push(node);
                    // node.key = id.substring(i + 1);
                    node.key = this.sanitize(id);
                }
            }
            return node;
        };

        items.forEach(function(d) {
            find(d.id, d);
        });

        return d3.hierarchy(map[""]);
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

    sanitize(string) {
        return string;



        // return string.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        //     return '&#'+i.charCodeAt(0)+';';
        // });
    }

    buildData(nodes: Node[], links: Link[]) {
        return nodes.map(node => {
            const targets = links.filter(link =>
                link.source === node.id
                && nodes.find(search => search.id === link.target)
            ).map(link => this.sanitize(link.target));

            const sources = links.filter(link =>
                link.target === node.id
                && nodes.find(search => search.id === link.source)
            ).map(link => this.sanitize(link.source));


            return Object.assign({}, node, {
                linksTo: targets.concat(sources),
                id: this.sanitize(node.id)
            });
        });
    }

    render() {
        return <div id="svgContainer" />;
    }
}

const select = (state) => {
    return {
        nodes: getSelectedNodes(state),
        links: getLinksForDisplay(state),
        items: state.entries.items
    };
};

export default connect(select)(Circle);