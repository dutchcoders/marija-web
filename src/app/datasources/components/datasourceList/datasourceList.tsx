import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Datasource } from '../../interfaces/datasource';
import DatasourceComponent from '../datasourceComponent/datasourceComponent';
import { connect } from 'react-redux';
import * as styles from './datasourceList.scss';
import { Link, withRouter } from 'react-router-dom';
import Url from '../../../main/helpers/url';

interface Props {
	datasources: Datasource[];
	dispatch: any;
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

				<Link to={{ pathname: '/create-custom-datasource', search: Url.getQueryString() }}>
					<button className={styles.create}>Create CSV datasource</button>
				</Link>
			</div>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	datasources: state.datasources.datasources.filter(datasource => datasource.type !== 'live')
});

export default withRouter(connect(select)(DatasourceList));