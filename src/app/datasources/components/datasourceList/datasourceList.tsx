import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Datasource } from '../../interfaces/datasource';
import DatasourceComponent from '../datasourceComponent/datasourceComponent';
import { connect } from 'react-redux';
import * as styles from './datasourceList.scss';
import { Link, withRouter } from 'react-router-dom';
import Url from '../../../main/helpers/url';
import { FormattedMessage } from 'react-intl';
import { getEnrichers, getNonEnrichers } from '../../datasourcesSelectors';

interface Props {
	datasources: Datasource[];
	enrichers: Datasource[];
	dispatch: any;
}

interface State {
}

class DatasourceList extends React.Component<Props, State> {
	render() {
		const { datasources, enrichers } = this.props;

		return (
			<div className={styles.list}>
				<h2><FormattedMessage id="datasources"/></h2>

				{datasources.map(datasource => (
					<DatasourceComponent datasource={datasource} key={datasource.id} />
				))}

				{enrichers.length > 0 && (
					<div>
						<h3><FormattedMessage id="enrichers"/></h3>
						{enrichers.map(datasource => (
							<DatasourceComponent datasource={datasource} key={datasource.id} />
						))}
					</div>
				)}

				<Link to={{ pathname: '/create-custom-datasource', search: Url.getQueryString() }}>
					<button className={styles.create}><FormattedMessage id="create_csv_datasource"/></button>
				</Link>
			</div>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	enrichers: getEnrichers(state),
	datasources: getNonEnrichers(state)
});

export default withRouter(connect(select)(DatasourceList));