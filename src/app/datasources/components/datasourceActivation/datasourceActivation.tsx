import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Datasource } from '../../interfaces/datasource';
import * as styles from './datasourceActivation.scss';
import {
	datasourceActivated,
	datasourceDeactivated
} from '../../datasourcesActions';
const logo = require('../../../../images/logo.png');

interface Props {
	datasources: Datasource[];
	connected: boolean;
	dispatch: any;
}

class DatasourceActivation extends React.Component<Props> {
	onChange(datasource: Datasource) {
		const { dispatch } = this.props;

		if (datasource.active) {
			dispatch(datasourceDeactivated(datasource));
		} else {
			dispatch(datasourceActivated(datasource));
		}
	}

	render() {
		const { datasources, connected } = this.props;

		return (
			<div className={styles.bar}>
				<img
					className={styles.logo + (connected ? '' : ' ' + styles.notConnected)}
					src={logo}
					title={connected ? "Marija is connected to the backendservice" : "No connection to Marija backend available" }
				/>

				<h2 className={styles.title}>Datasources:</h2>

				<ul className={styles.list}>
					{datasources.map(datasource =>
						<li className={styles.item} key={datasource.id}>
							<label className={styles.label}>
								<input
									type="checkbox"
									className={styles.checkbox}
									checked={datasource.active}
									onChange={() => this.onChange(datasource)}
								/>
								{datasource.name}
							</label>
						</li>
					)}
				</ul>
			</div>
		);
	}
}

const select = (state: AppState) => ({
	datasources: state.datasources.datasources,
	connected: state.connection.connected,
});

export default connect(select)(DatasourceActivation);