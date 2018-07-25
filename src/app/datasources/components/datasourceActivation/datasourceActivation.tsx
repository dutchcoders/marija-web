import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Datasource } from '../../interfaces/datasource';
import * as styles from './datasourceActivation.scss';
import {
	datasourceActivated,
	datasourceDeactivated
} from '../../datasourcesActions';
import { getNonLiveDatasources } from '../../datasourcesSelectors';
import Icon from '../../../ui/components/icon';
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

				<h2 className={styles.title}>Search in:</h2>

				<ul className={styles.list}>
					{datasources.map(datasource =>
						<li className={styles.item} key={datasource.id}>
							<label className={styles.label} onClick={() => this.onChange(datasource)}>
								<Icon name={styles.check + ' ' + (
									datasource.active ?
										'ion-android-checkbox ' + styles.active :
										'ion-android-checkbox-blank'
								)} />
								<span className={styles.name}>{datasource.name}</span>
							</label>
						</li>
					)}
				</ul>
			</div>
		);
	}
}

const select = (state: AppState) => ({
	datasources: getNonLiveDatasources(state),
	connected: state.connection.connected,
});

export default connect(select)(DatasourceActivation);