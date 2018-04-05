import * as React from 'react';
import {connect} from 'react-redux';
import {AppState} from "../../interfaces/appState";

interface Props {
    serverVersion: string;
    fps: number;
}

interface State {
}

class Stats extends React.Component<Props, State> {
    render() {
        const { serverVersion, fps } = this.props;
        const clientVersion = process.env.CLIENT_VERSION;

        return (
            <p className="stats">
                {fps.toFixed(1)}<br />
                SERVER VERSION: {serverVersion}<br />
                CLIENT VERSION: {clientVersion}
            </p>
        );
    }
}


const select = (state: AppState, ownProps) => {
    return {
        serverVersion: state.stats.serverVersion,
        fps: state.stats.fps
    };
};

export default connect(select)(Stats);
