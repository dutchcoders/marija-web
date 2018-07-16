import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../main/interfaces/appState';
import { Node } from '../graph/interfaces/node';
import { Link } from '../graph/interfaces/link';
import {
	getLinksForDisplay,
	getNodesForDisplay
} from '../graph/graphSelectors';
import { Item } from '../items/interfaces/item';

interface Props {
    fps: number;
    nodesForDisplay: Node[];
    linksForDisplay: Link[];
    nodes: Node[];
    links: Link[];
    items: Item[];
}

interface State {
}

class Stats extends React.Component<Props, State> {
    render() {
        const { fps, nodesForDisplay, linksForDisplay, nodes, links, items } = this.props;

        return (
            <p className="stats">
                {fps.toFixed(1)} FPS<br />
				{nodesForDisplay.length}/{nodes.length} Nodes<br />
				{linksForDisplay.length}/{links.length} Links<br />
				{items.length} Items
            </p>
        );
    }
}


const select = (state: AppState, ownProps) => {
    return {
        fps: state.stats.fps,
		nodes: state.graph.nodes,
		links: state.graph.links,
        nodesForDisplay: getNodesForDisplay(state),
        linksForDisplay: getLinksForDisplay(state),
		items: state.graph.items
    };
};

export default connect(select)(Stats);
