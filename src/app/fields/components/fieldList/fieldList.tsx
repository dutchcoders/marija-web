import * as React from 'react';
import { Field } from '../../interfaces/field';
import { AppState } from '../../../main/interfaces/appState';
import { selectFieldList } from '../../fieldsSelectors';
import { connect } from 'react-redux';
import FieldRow from '../fieldRow/fieldRow';
import * as styles from './fieldList.scss';

interface Props {
	fields: Field[];
	query: string;
	types: string[];
	datasourceId: string;
}

interface State {
	maxFields: number;
}

class FieldList extends React.Component<Props, State> {
	readonly defaultMaxFields: number = 20;
	state: State = {
		maxFields: this.defaultMaxFields
	};


	handleMaxFieldsChange(maxFields: number) {
		this.setState({
			maxFields
		});
	}

	render() {
		const { fields } = this.props;
		const { maxFields } = this.state;

		let numMore = null;
		let showMore = null;
		if (fields.length > maxFields) {
			numMore = (
				<p key={1}>
					{fields.length - maxFields} more fields
				</p>
			);

			showMore = (
				<button onClick={() => this.handleMaxFieldsChange(maxFields + 20)} key={2}>
					Show more
				</button>
			);
		}

		let showLess = null;
		if (maxFields > this.defaultMaxFields) {
			showLess = (
				<button
					className="showLess"
					onClick={() => this.handleMaxFieldsChange(this.defaultMaxFields)}
					key={3}>
					Show less
				</button>
			);
		}

		let noResults = null;
		if (fields.length === 0) {
			noResults = (
				<p>No fields found</p>
			);
		}

		const firstX = fields.slice(0, maxFields);

		return (
			<div className={styles.fieldList}>
				<table key={1} className={styles.fieldTable}>
					<thead>
					<tr>
						<td className={styles.fieldHead}>Type</td>
						<td className={styles.fieldHead}>Field</td>
						<td className={styles.fieldHead}>Datasource</td>
						<td />
					</tr>
					</thead>
					<tbody>
					{firstX.map((item, i) =>
						<FieldRow
							key={'available_fields_' + item.path + i}
							field={item}
						/>
					)}
					</tbody>
				</table>
				<div className="searchResultsFooter" key={2}>
					{numMore}
					{showMore}
					{showLess}
					{noResults}
				</div>
			</div>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	fields: selectFieldList(state, ownProps.query, ownProps.types, ownProps.datasourceId)
});

export default connect(select)(FieldList);