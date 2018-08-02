import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Connector } from '../../../graph/interfaces/connector';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './connectorList.scss';
import ConnectorComponent from '../connectorComponent/connectorComponent';
import { Link, withRouter } from 'react-router-dom';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';
import { FormEvent } from 'react';
import { setAutomaticallyCreateConnectors } from '../../../graph/graphActions';
import { MAX_AUTOMATIC_CONNECTORS } from '../../../graph/graphConstants';

interface State {
	isHelpOpen: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	connectors: Connector[];
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
		const { connectors, automaticallyCreateConnectors } = this.props;

		const hasConnectorsWithMultipleRules: boolean = typeof connectors.find(connector =>
			connector.rules.length > 1
		) !== 'undefined';

		const help = (
			<div className={styles.help}>
				<FormattedHTMLMessage id="connectors_explanation"/>
			</div>
		);

		return (
			<div className={styles.connectors}>
				<h2><FormattedMessage id="active_connectors"/></h2>

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

				<label className={styles.automagic}>
					<input type="checkbox" onChange={this.setAutomaticallyCreateConnectors.bind(this)} checked={automaticallyCreateConnectors}/>
					<FormattedMessage id="automatically_create_connectors" values={{max: MAX_AUTOMATIC_CONNECTORS}}/>
				</label>
			</div>
		);
	}
}

function select(state: AppState) {
	return {
		connectors: state.fields.connectors,
		automaticallyCreateConnectors: state.graph.automaticallyCreateConnectors
	};
}

export default withRouter(connect(select)(ConnectorList));
