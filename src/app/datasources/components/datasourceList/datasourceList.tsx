import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Datasource } from '../../interfaces/datasource';
import DatasourceComponent from '../datasourceComponent/datasourceComponent';
import { connect } from 'react-redux';
import * as styles from './datasourceList.scss';

interface Props {
	datasources: Datasource[];
}

interface State {

}

class DatasourceList extends React.Component<Props, State> {
	render() {
		const { datasources } = this.props;

		return (
			<div className={styles.list}>
				<h2>Datasources</h2>

				{datasources.map(datasource => (
					<DatasourceComponent datasource={datasource} key={datasource.id} />
				))}
			</div>
		);
	}
}

const select = (state: AppState) => ({
	datasources: state.datasources.datasources.filter(datasource => datasource.type !== 'live')
});

export default connect(select)(DatasourceList);