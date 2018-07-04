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

				<button className={styles.toggleAdvanced} onClick={this.toggleAdvanced.bind(this)}>
					{isDragging ? 'Done' : 'Advanced'}
				</button>
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
