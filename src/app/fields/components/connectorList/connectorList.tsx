import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Connector } from '../../../graph/interfaces/connector';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './connectorList.scss';
import ConnectorComponent from '../connectorComponent/connectorComponent';
import { Link, withRouter } from 'react-router-dom';
import Url from '../../../main/helpers/url';
import { FormEvent } from 'react';
import { setAutomaticallyCreateConnectors } from '../../../graph/graphActions';

interface State {
	isHelpOpen: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	connectors: Connector[];
	experimentalFeatures: boolean;
	automaticallyCreateConnectors: boolean;
}

class ConnectorList extends React.Component<Props, State> {
	state: State = {
		isHelpOpen: false
	};

	toggleHelp() {
		const { isHelpOpen } = this.state;

		this.setState({
			isHelpOpen: !isHelpOpen
		});
	}

	setAutomaticallyCreateConnectors(event: FormEvent<HTMLInputElement>) {
		const { dispatch, automaticallyCreateConnectors } = this.props;

		dispatch(setAutomaticallyCreateConnectors(!automaticallyCreateConnectors));
	}

	render() {
		const { isHelpOpen } = this.state;
		const { connectors, experimentalFeatures, automaticallyCreateConnectors } = this.props;

		const hasConnectorsWithMultipleRules: boolean = typeof connectors.find(connector =>
			connector.rules.length > 1
		) !== 'undefined';

		const help = (
			<div className={styles.help}>
				<p>Select a field below to create a new connector. Connectors are used to link data together.</p>
				<p>
					<strong>Example: </strong>
					Let's say you have two people in your datasource: John Smith and William Smith. Their last name is
					the same, but their first names are different.
				</p>
				<p>
					If you create a connector for the field <em>last_name</em>, a square connector node will be drawn
					between the two round people nodes. The <em>last_name</em> square node <strong>Smith</strong> will connect
					the round nodes <strong>John Smith</strong> and <strong>William Smith</strong>.
				</p>
			</div>
		);

		return (
			<div className={styles.connectors}>
				<h2>Connectors</h2>

				{connectors.map(connector => (
					<ConnectorComponent connector={connector} key={connector.name} />
				))}

				{hasConnectorsWithMultipleRules &&
					<ConnectorComponent connector={null} />
				}

				{connectors.length > 0 ? (
					<button key={1} className={styles.toggleHelp} onClick={this.toggleHelp.bind(this)}>
						{isHelpOpen ? 'Hide help' : 'Help'}
					</button>
				) : null}

				{connectors.length === 0 || isHelpOpen ? help : null}

				{experimentalFeatures && (
					<div>
						<Link to={{ pathname: '/connector-wizard', search: Url.getQueryString() }}>
							<button className={styles.connectorWizard}>Suggest connectors</button>
						</Link>
						<label>
							<input type="checkbox" onChange={this.setAutomaticallyCreateConnectors.bind(this)} checked={automaticallyCreateConnectors}/>
							Automatically create connectors
						</label>
					</div>
				)}
			</div>
		);
	}
}

function select(state: AppState) {
	return {
		connectors: state.fields.connectors,
		experimentalFeatures: state.ui.experimentalFeatures,
		automaticallyCreateConnectors: state.graph.automaticallyCreateConnectors
	};
}

export default withRouter(connect(select)(ConnectorList));
