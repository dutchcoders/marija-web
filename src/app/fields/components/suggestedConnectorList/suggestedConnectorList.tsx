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
							<ul className={styles.rules}>
								{suggested.rules.map(rule =>
									<li className={styles.rule} key={rule.id}>{rule.field.path}</li>
								)}
							</ul>
							<Icon name={'ion-ios-plus ' + styles.create} onClick={() => this.create(suggested)} />
						</li>
					)}
				</ul>
			</div>
		);

		// return suggestedConnectors.length > 0 ? (
		// 	<ul className={styles.list}>
		// 		{suggestedConnectors.map(suggested =>
		// 			<li className={styles.suggested} key={suggested.fields.join(',')}>
		// 				<ul className={styles.fieldList}>
		// 					{suggested.fields.map(field =>
		// 						<li className={styles.field} key={field}>{field}</li>
		// 					)}
		// 				</ul>
		// 				<p className={styles.description}>Would create {suggested.uniqueConnectors} unique connector nodes and {suggested.links} new connections.</p>
		// 				<button className={styles.create} onClick={() => this.create(suggested)}>Create</button>
		// 			</li>
		// 		)}
		// 	</ul>
		// ) : (
		// 	<p className={styles.none}>No suggested connectors found.</p>
		// );
	}
}

const select = (state: AppState) => ({
	suggestedConnectors: state.fields.suggestedConnectors,
});

export default connect(select)(SuggestedConnectorList);