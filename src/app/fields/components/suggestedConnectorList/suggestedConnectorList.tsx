import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import {
	SuggestedConnector
} from '../../helpers/getSuggestedConnectors';
import { connect } from 'react-redux';
import * as styles from './suggestedConnectorList.scss';
import { selectSuggestedConnectors } from '../../fieldsSelectors';
import { Field } from '../../interfaces/field';
import { createNewConnector } from '../../fieldsActions';

interface Props {
	suggestedConnectors: SuggestedConnector[];
	availableFields: Field[];
	dispatch: any;
}

class SuggestedConnectorList extends React.Component<Props> {
	create(suggested: SuggestedConnector) {
		const { dispatch, availableFields } = this.props;

		const fields = [];

		suggested.fields.forEach(field => {
			fields.push(availableFields.find(search => search.path === field));
		});

		dispatch(createNewConnector(fields));
	}

	render() {
		const { suggestedConnectors } = this.props;

		return (
			<ul className={styles.list}>
				{suggestedConnectors.map(suggested =>
					<li className={styles.suggested} key={suggested.fields.join(',')}>
						<ul className={styles.fieldList}>
							{suggested.fields.map(field =>
								<li className={styles.field} key={field}>{field}</li>
							)}
						</ul>
						<p className={styles.description}>Would create {suggested.uniqueConnectors} unique connector nodes and {suggested.links} new connections.</p>
						<button className={styles.create} onClick={() => this.create(suggested)}>Create</button>
					</li>
				)}
			</ul>
		);
	}
}

const select = (state: AppState) => ({
	suggestedConnectors: selectSuggestedConnectors(state),
	availableFields: state.fields.availableFields
});

export default connect(select)(SuggestedConnectorList);