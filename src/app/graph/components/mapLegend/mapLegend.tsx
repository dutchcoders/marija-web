import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Connector } from '../../interfaces/connector';
import * as styles from './mapLegend.scss';
import {
	getNodesGroupedByConnector,
	getNodesGroupedByDatasource,
	GroupedNodes
} from '../../graphSelectors';
import { Datasource } from '../../../datasources/interfaces/datasource';
import MagicWand from '../magicWand/magicWand';

interface Props {
	connectors: Connector[];
	datasources: Datasource[];
	nodesGroupedByConnector: GroupedNodes;
	nodesGroupedByDatasource: GroupedNodes;
}

class MapLegend extends React.Component<Props> {
	render() {
		const { connectors, datasources, nodesGroupedByConnector, nodesGroupedByDatasource } = this.props;

		let datasourcesWithNodes = datasources.filter(datasource =>
			typeof nodesGroupedByDatasource[datasource.id] !== 'undefined'
		);

		let connectorsWithNodes = connectors.filter(connector =>
			typeof nodesGroupedByConnector[connector.name] !== 'undefined'
		);

		return (
			<ul className={styles.legend}>
				{datasourcesWithNodes.map(datasource =>
					<li className={styles.element} key={datasource.name}>
						<div className={styles.icon + ' ' + styles.itemIcon}>
							{datasource.icon}
						</div>
						<MagicWand nodes={nodesGroupedByDatasource[datasource.id]} cssClass={styles.magicWand} />
						<h2 className={styles.title}>{datasource.name}</h2>
					</li>
				)}

				{connectorsWithNodes.map(connector =>
					<li className={styles.element} key={connector.name}>
						<div style={{backgroundColor: connector.color}}
							className={styles.icon}>
							{connector.icon}
						</div>
						<MagicWand nodes={nodesGroupedByConnector[connector.name]} cssClass={styles.magicWand} />
						<h2 className={styles.title}>{connector.rules.map(rule => rule.field.path).join(', ')}</h2>
					</li>
				)}
			</ul>
		);
	}
}

const select = (state: AppState) => ({
	connectors: state.fields.connectors,
	datasources: state.datasources.datasources,
	nodesGroupedByConnector: getNodesGroupedByConnector(state),
	nodesGroupedByDatasource: getNodesGroupedByDatasource(state)
});

export default connect(select)(MapLegend);