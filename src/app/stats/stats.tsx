import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../main/interfaces/appState';
import { Node } from '../graph/interfaces/node';
import { Link } from '../graph/interfaces/link';
import {
} from '../graph/graphSelectors';
import { Item } from '../graph/interfaces/item';

interface Props {
    fps: number;
    nodes: Node[];
    links: Link[];
    items: Item[];
}

interface State {
}

class Stats extends React.Component<Props, State> {
    render() {
        const { fps, nodes, links, items } = this.props;

        return (
            <p className="stats">
                {fps.toFixed(1)} FPS<br />
				{nodes.length} Nodes<br />
				{links.length} Links<br />
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
		items: state.graph.items
    };
};

export default connect(select)(Stats);
