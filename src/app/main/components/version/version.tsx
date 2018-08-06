import * as React from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../interfaces/appState';
import { FormattedMessage } from 'react-intl';

interface Props {
	serverVersion: string;
}

interface State {
}

class Version extends React.Component<Props, State> {
	render() {
		const { serverVersion } = this.props;
		const clientVersion = process.env.CLIENT_VERSION;
		const lastCommitDate = process.env.LAST_COMMIT_DATE;

		return (
			<div>
				<h2><FormattedMessage id="version"/></h2>
				<p>
					Server: {serverVersion}<br />
					Client: {clientVersion} ({lastCommitDate})
				</p>
			</div>
		);
	}
}


const select = (state: AppState, ownProps) => {
	return {
		serverVersion: state.stats.serverVersion,
	};
};

export default connect(select)(Version);
