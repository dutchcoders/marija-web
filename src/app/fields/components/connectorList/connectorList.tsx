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
}

interface Props {
	dispatch: Dispatch<any>;
	connectors: Connector[];
}

class ConnectorList extends React.Component<Props, State> {
	state: State = {
		isDragging: false
	};

	toggleAdvanced() {
		const { isDragging } = this.state;

		this.setState({
			isDragging: !isDragging
		});
	}

	render() {
		const { isDragging } = this.state;
		const { connectors } = this.props;

		return (
			<div className={styles.connectors}>
				<h2>Connectors</h2>

				{connectors.map(connector => (
					<ConnectorComponent connector={connector} isDragging={isDragging} key={connector.name} />
				))}

				{isDragging &&
					<ConnectorComponent connector={null} isDragging={true} />
				}

				{connectors.length === 0
					? ([
						<p key={0}>Select a field below to create a new connector. Connectors are used to link data together.</p>,
						<p key={1}>
							<strong>Example: </strong>
							Let's say you have two items in your data with the same last name: Smith.
							If you then create a connector for the field <em>last_name</em>, a square connector node will be drawn
							between the two round item nodes.
						</p>
					]) : (
						<button className={styles.toggleAdvanced} onClick={this.toggleAdvanced.bind(this)}>
							{isDragging ? 'Done' : 'Advanced'}
						</button>
					)}
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
