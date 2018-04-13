import * as React from 'react';
import * as styles from './adjacencyMatrix.scss';
import {Node} from "../../interfaces/node";
import {Link} from "../../interfaces/link";
import {AppState} from "../../../main/interfaces/appState";
import {getLinksForDisplay, getSelectedNodes} from "../../graphSelectors";
import {connect, Dispatch} from "react-redux";
import {Search} from "../../../search/interfaces/search";
import * as d3 from 'd3';
import {EventEmitter} from "fbemitter";
import {FormEvent} from "react";

interface Props {
    selectedNodes: Node[];
    links: Link[];
    searches: Search[];
    dispatch: Dispatch<any>;
}

interface State {
    sort: 'alphabetically' | 'frequency'
}

class AdjacencyMatrix extends React.Component<Props, State> {
    state: State = {
        sort: 'frequency'
    };

    mounted = false;
    matrix: SVGSVGElement;
    transform: any = d3.zoomIdentity;
    renderedTransform: boolean = true;

    renderMatrix(nodes: Node[], links: Link[]) {
        const { sort } = this.state;

        const linkMap = {};
        links.forEach(link =>
            linkMap[link.source + '-' + link.target] = link
        );

        const linkCount = {};
        links.forEach(link => {
            if (linkCount[link.source]) {
                linkCount[link.source] += link.itemIds.length
            } else {
                linkCount[link.source] = link.itemIds.length;
            }

            if (linkCount[link.target]) {
                linkCount[link.target] += link.itemIds.length
            } else {
                linkCount[link.target] = link.itemIds.length;
            }
        });

        nodes = nodes.concat([]);

        if (sort === 'alphabetically') {
            nodes.sort((a, b) => {
                const aLower = a.id.toLowerCase();
                const bLower = b.id.toLowerCase();

                if (aLower < bLower) return -1;
                if (aLower > bLower) return 1;
                return 0;
            });
        } else if (sort === 'frequency') {
            nodes.sort((a, b) => linkCount[b.id] - linkCount[a.id]);
        }

        const matrix = [];
        nodes.forEach((source, a) => {
            nodes.forEach((target, b) => {
                const key = source.id + '-' + target.id;
                const opposite = target.id + '-' + source.id;
                let total: number = 0;

                if (linkMap[key]) {
                    total = linkMap[key].itemIds.length;
                } else if (linkMap[opposite]) {
                    total = linkMap[opposite].itemIds.length;
                }

                const grid = {
                    id: source.id + "-" + target.id,
                    x: b,
                    y: a,
                    total: total
                };

                matrix.push(grid);
            });
        });

        d3.select("svg > *").remove();

        const squareSize = 20;

        const stage = d3.select(this.matrix).append('g');

        stage.attr('class', 'stage');

        stage.append("g")
            .attr("transform","translate(50,50)")
            .attr("id","adjacencyG")
            .selectAll("rect")
            .data(matrix)
            .enter()
            .append("rect")
            .attr("class", styles.grid)
            .attr("width",squareSize)
            .attr("height",squareSize)
            .attr("x", d=> d.x*squareSize)
            .attr("y", d=> d.y*squareSize)
            .style("fill-opacity", d=> d.total * .2);

        const getX = (i) => i * squareSize + .5 * squareSize;

        stage.append('g')
            .attr("transform","translate(50,50)")
            .selectAll('text')
            .data(matrix.filter(d => d.total > 0))
            .enter()
            .append("text")
            .attr('class', styles.total)
            .attr("x", d=> d.x*squareSize + (squareSize * .5))
            .attr("y", d=> d.y*squareSize + 14)
            .text((d: any) => d.total)
            .style("text-anchor","middle");

        stage
            .append("g")
            .attr("transform","translate(50,43)")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("transform", (d, i) => "rotate(-30 " + (getX(i)) + "  " + (0) + ")")
            .attr('class', styles.node)
            .attr("x", (d,i) => getX(i))
            .text((d: any) => d.id)
            .style("text-anchor","start")
            .style("font-size","10px");

        stage
            .append("g").attr("transform","translate(43,50)")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("y",(d,i) => i * squareSize + 13)
            .attr('class', styles.node)
            .text((d: any) => d.id)
            .style("text-anchor","end")
            .style("font-size","10px");

        const zooming = d3.zoom()
            .scaleExtent([.3, 3])
            .on("zoom", this.zoomed.bind(this));

        d3.select(this.matrix).call(zooming);

        stage.on('mouseout', () => {
            d3.selectAll("rect")
                .classed(styles.highlight, false);
        });

        d3.selectAll('.' + styles.grid).on("mouseover", (d: any) => {
            d3.selectAll("rect")
                .classed(styles.highlight, (p: any) =>
                    p.x == d.x || p.y == d.y
                );
        });
    }

    zoomed() {
        this.transform = d3.event.transform;
        this.renderedTransform = false;
    }

    componentWillReceiveProps(props: Props) {
        const {selectedNodes} = this.props;

        if (selectedNodes.length !== props.selectedNodes.length) {
            this.renderMatrix(props.selectedNodes, props.links);
        }
    }

    renderZoom() {
        d3.select(this.matrix)
            .selectAll('.stage').attr('transform', this.transform);
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

    componentDidMount() {
        const {selectedNodes, links} = this.props;
        this.renderMatrix(selectedNodes, links);

        this.mounted = true;
        requestAnimationFrame(() => this.ticker());
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { sort } = this.state;
        const { selectedNodes, links } = this.props;

        if (sort !== prevState.sort) {
            this.renderMatrix(selectedNodes, links);
        }
    }

    handleSortChange(event: FormEvent<HTMLSelectElement>) {
        this.setState({
            sort: event.currentTarget.value as any
        });
    }

    render() {
        const { sort } = this.state;

        return (
            <div className={styles.container}>
                <div className={styles.sort}>
                    <label className={styles.sortLabel}>Sort:</label>
                    <select className={styles.sortSelect} defaultValue={sort} onChange={this.handleSortChange.bind(this)}>
                        <option value="frequency">Frequency</option>
                        <option value="alphabetically">Alphabetically</option>
                    </select>
                </div>
                <svg
                    ref={ref => this.matrix = ref}
                    className={styles.matrix}
                />
            </div>
        );
    }
}


const select = (state: AppState) => {
    return {
        selectedNodes: getSelectedNodes(state),
        links: getLinksForDisplay(state),
        searches: state.graph.searches
    };
};

export default connect(select)(AdjacencyMatrix);