import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../main/interfaces/appState';
import { Node } from '../graph/interfaces/node';
import { Link } from '../graph/interfaces/link';
import {
	getLinksForDisplay,
	getNodesForDisplay
} from '../graph/graphSelectors';

interface Props {
    serverVersion: string;
    fps: number;
    nodesForDisplay: Node[];
    linksForDisplay: Link[];
}

interface State {
}

class Stats extends React.Component<Props, State> {
    render() {
        const { serverVersion, fps, nodesForDisplay, linksForDisplay } = this.props;
        const clientVersion = process.env.CLIENT_VERSION;
        const lastCommitDate = process.env.LAST_COMMIT_DATE;

        return (
            <p className="stats">
                {fps.toFixed(1)} FPS {nodesForDisplay.length} nodes {linksForDisplay.length} links<br />
                Server: {serverVersion}<br />
                Client: {clientVersion} ({lastCommitDate})
            </p>
        );
    }
}


const select = (state: AppState, ownProps) => {
    return {
        serverVersion: state.stats.serverVersion,
        fps: state.stats.fps,
        nodesForDisplay: getNodesForDisplay(state),
        linksForDisplay: getLinksForDisplay(state),
    };
};

export default connect(select)(Stats);
