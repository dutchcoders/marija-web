import React from 'react';

export default class ConnectionStatus extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {connected} = this.props;
        return <div>{connected ? 'connected' : 'not connected'}</div>
    }
}
