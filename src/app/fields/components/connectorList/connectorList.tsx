import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Connector } from '../../../graph/interfaces/connector';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './connectorList.scss';
import ConnectorComponent from '../connectorComponent/connectorComponent';

interface State {
	isDragging: boolean;
	isHelpOpen: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	connectors: Connector[];
}

class ConnectorList extends React.Component<Props, State> {
	state: State = {
		isDragging: false,
		isHelpOpen: false
	};

	toggleAdvanced() {
		const { isDragging } = this.state;

		this.setState({
			isDragging: !isDragging
		});
	}

	toggleHelp() {
		const { isHelpOpen } = this.state;

		this.setState({
			isHelpOpen: !isHelpOpen
		});
	}

	render() {
		const { isDragging, isHelpOpen } = this.state;
		const { connectors } = this.props;

		const help = (
			<div className={styles.help}>
				<p>Select a field below to create a new connector. Connectors are used to link data together.</p>
				<p>
					<strong>Example: </strong>
					Let's say you have two items in your data with the same last name: Smith.
					If you then create a connector for the field <em>last_name</em>, a square connector node will be drawn
					between the two round item nodes.
				</p>
			</div>
		);

		return (
			<div className={styles.connectors}>
				<h2>Connectors</h2>

				{connectors.map(connector => (
					<ConnectorComponent connector={connector} isDragging={isDragging} key={connector.name} />
				))}

				{isDragging &&
					<ConnectorComponent connector={null} isDragging={true} />
				}

				{connectors.length > 0 ? ([
						<button key={0} className={styles.toggleAdvanced} onClick={this.toggleAdvanced.bind(this)}>
							{isDragging ? 'Done' : 'Advanced'}
						</button>,
						<button key={1} className={styles.toggleHelp} onClick={this.toggleHelp.bind(this)}>
							Help
						</button>
					]) : null}

				{connectors.length === 0 || isHelpOpen ? help : null}
			</div>
		);
	}
}


function select(state: AppState) {
	return {
		connectors: state.fields.connectors
	};
}

export default connect(select)(ConnectorList);
