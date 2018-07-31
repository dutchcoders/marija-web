import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Connector } from '../../../graph/interfaces/connector';
import * as styles from './suggestedConnectorList.scss';
import { createNewConnector } from '../../fieldsActions';
import Icon from '../../../ui/components/icon';

interface Props {
	suggestedConnectors: Connector[];
	dispatch: any;
}

class SuggestedConnectorList extends React.Component<Props> {
	create(connector: Connector) {
		const { dispatch } = this.props;
		const fields = connector.rules.map(rule => rule.field);

		dispatch(createNewConnector(fields));
	}

	getTotalLinks(suggested: Connector) {
		return Object.keys(suggested.suggestionPotential).reduce((prev, current) =>
			prev + suggested.suggestionPotential[current],
			0
		);
	}

	getExampleValues(suggested: Connector) {
		let sortable = [];

		Object.keys(suggested.suggestionPotential).forEach(value => {
			sortable.push([value, suggested.suggestionPotential[value]]);
		});

		sortable.sort((a, b) => b[1] - a[1]);
		const maxValues = 5;

		sortable = sortable.slice(0, maxValues);

		return sortable.map(item => item[0] + ' (' + item[1] + ')');
	}

	render() {
		const { suggestedConnectors } = this.props;

		if (suggestedConnectors.length === 0) {
			return null;
		}

		return (
			<div className={styles.container}>
				<h2 className={styles.title}>Suggested connectors</h2>
				<ul className={styles.connectors}>
					{suggestedConnectors.map(suggested =>
						<li className={styles.connector} key={suggested.name}>
							<div className={styles.header}>
								<ul className={styles.rules}>
									{suggested.rules.map(rule =>
										<li className={styles.rule} key={rule.id}>{rule.field.path}</li>
									)}
								</ul>
								<Icon name={'ion-ios-plus ' + styles.create} onClick={() => this.create(suggested)} />
							</div>
							<div className={styles.info}>
								Create {Object.keys(suggested.suggestionPotential).length} connector nodes, connecting {this.getTotalLinks(suggested)} items.<br />
								Example values: {this.getExampleValues(suggested).join(', ')}
							</div>
						</li>
					)}
				</ul>
			</div>
		);
	}
}

const select = (state: AppState) => ({
	suggestedConnectors: state.fields.suggestedConnectors,
});

export default connect(select)(SuggestedConnectorList);